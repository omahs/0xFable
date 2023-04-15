Fpragma circom 2.0.0;

include "../node_modules/circomlib/circuits/mimcsponge.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

// NOTE(norswap): hash path == Merkle branch

template HashLeftRight() {
    signal input left;
    signal input right;
    signal output hash;

    component hasher = MiMCSponge(2, 220, 1);
    hasher.ins[0] <== left;
    hasher.ins[1] <== right;
    hasher.k <== 0;
    hash <== hasher.outs[0];
}

// if s == 0 returns [in[0], in[1]]
// if s == 1 returns [in[1], in[0]]
template DualMux() {
    signal input in[2];
    signal input s;
    signal output out[2];

    s * (1 - s) === 0;
    out[0] <== (in[1] - in[0]) * s + in[0];
    out[1] <== (in[0] - in[1]) * s + in[1];
}

// Compute a Merkle root given a Merkle path and a leaf.
template ConstructRoot(levels) {
    signal output root;
    signal input leaf;
    signal input index;
    signal input hashPath[levels];

    component selectors[levels];
    component hashers[levels];
    component index2path = Num2Bits(levels);

    index2path.in <== index;

    for (var i = 0; i < levels; i++) {
        selectors[i] = DualMux();
        selectors[i].in[0] <== i == 0 ? leaf : hashers[i - 1].hash;
        selectors[i].in[1] <== hashPath[i];
        selectors[i].s <== index2path.out[i];

        hashers[i] = HashLeftRight();
        hashers[i].left <== selectors[i].out[0];
        hashers[i].right <== selectors[i].out[1];
    }

    root <== hashers[levels - 1].hash;
}

// Verifies that a Merkle proof is correct for given Merkle root and leaf.
template CheckMembership(levels) {
    signal input root;
    signal input leaf;
    // The index is necessary to determine which side the hash in hashPath is on,
    // at each level in the tree.
    signal input index;
    signal input hashPath[levels];

    component constructRoot = ConstructRoot(levels);
    constructRoot.leaf <== leaf;
    constructRoot.index <== index;
    constructRoot.hashPath <== hashPath;

    root === constructRoot.root;
}

// Check that the Merkle proof for a leaf has a "valid shape" to be the last leaf in the deck, i.e.
// every item from the Merkle branch representing a right sibling in the tree is as hash by hashing
// a subsequence of null (255) items up to that level, AND that the leaf is non-null (unless
// the index is 0, meaning all leaves in the Merkle tree are null).
//
// This is enough to guarantee that the leaf is the the last in a deck — after checking it the
// proof against that deck root, which is not performed here!
template CheckLastLeaf(levels) {
    signal input leaf;
    signal input index;
    signal input hashPath[levels];

    component leafIsNull = IsEqual();
    component index2path = Num2Bits(levels);
    component zeroHashers[levels];

    // The leaf can only be null if its index is 0 (cf. above).
    leafIsNull.in[0] <== leaf;
    leafIsNull.in[1] <== 255;
    leafIsNull.out * index === 0;

    index2path.in <== index;
    var zeroHash = 255;

    for (var i = 0; i < levels; i++) {
        var s = index2path.out[i];
        var hash = hashPath[i];

        // The hash must be "level null" (obtained from hashing a subsequence of null (255) leafs up
        // to that level) if it represents a right child.
        // When s == 0, it means the leaf is a descendent of the left child, meaning the hash
        // represent a right child.
        (1 - s) * (zeroHash - hash) === 0;

        zeroHashers[i] = HashLeftRight();
        zeroHashers[i].left <== zeroHash;
        zeroHashers[i].right <== zeroHash;
        zeroHash = zeroHashers[i].hash;
    }
}

// Checks that the Merkle root is updated by appending a leaf after existing non-null leaves.
// This works even if the root represents a Merkle tree where all the leaves are null (255).
template CheckAppendToLeaves(levels) {
    signal input root;
    signal input newRoot;
    signal input appendedLeaf;
    // The last leaf is either the last non-null leaf, or the first null leaf if all leaves are null.
    signal input lastLeaf;
    signal input lastLeafIndex;
    // The Merkle branch for the last leaf against the original root.
    signal input lastLeafHashPath[levels];
    // This Merkle branch acts as both a Merkle proof of 255 being at the insertion index (*) in root,
    // and a Merkle proof of lastLeaf being at the insertion index in newRoot.
    // (*) The insertion index is lastLeafIndex if all leaves are null, lastLeafIndex + 1 otherwise.
    signal input appendedleafHashPath[levels];

    // Check that the least leaf is in the deck.
    component checkTailMembership = CheckMembership(levels);
    checkTailMembership.root <== root;
    checkTailMembership.leaf <== lastLeaf;
    checkTailMembership.index <== lastLeafIndex;
    checkTailMembership.hashPath <== lastLeafHashPath;

    // Check that the claimed last leaf is indeed the last non-null leaf.
    component checkTail = CheckLastLeaf(levels);
    checkTail.leaf <== lastLeaf;
    checkTail.index <== lastLeafIndex;
    checkTail.hashPath <== lastLeafHashPath;

    component isZero = IsZero();
    isZero.in <== lastLeafIndex;

    // Validate appendedLeafHashPath against the initial root.
    component validatePath = CheckMembership(levels);
    validatePath.root <== root;
    validatePath.leaf <== 255;
    validatePath.index <== lastLeafIndex + 1 - isZero.out;
    validatePath.hashPath <== appendedLeafHashPath;

    // Check that the new root is obtained by appending the leaf to the original deck,
    // using the validated Merkle path.
    component checkNewRoot = CheckMembership(levels);
    checkNewRoot.root <== newRoot;
    checkNewRoot.leaf <== appendedLeaf;
    checkNewRoot.index <== lastLeafIndex + 1 - isZero.out;
    checkNewRoot.hashPath <== appendedLeafHashPath;
}

// Checks that the Merkle root is updated by removing a leaf and replacing it by the last non-null
// leaf in the deck, which is itself replaced by a null (255) leaf.
//
// This works even if there is only one leaf in the deck, in which case the removedLeaf and the
// lastLeaf are identical. TODO: handle the case where we are removing the last card in the deck
template CheckRemoveLeaf(levels) {
    signal input root;
    signal input newRoot;
    signal input removedLeaf;
    signal input removedLeafIndex;
    // The Merkle branch for the leaf that we are removing against the original root.
    signal input removedLeafHashPath[levels];
    signal input lastLeaf;
    // The original position of the last leaf.
    signal input lastLeafIndex;
    // The Merkle branch for the last leaf (at its original position), against a temporary root
    // obtained by replacing the removed leaf with the last leaf.
    signal input lastLeafHashPath[levels];

    // Can't remove an empty leaf.
    removedLeaf !== 255;

    // Check that the item that we are removing is in the deck.
    // What is usefully being proven here is actually that the Merkle branch is congruent with the root.
    component checkRemovedLeafMembership = CheckMembership(levels);
    checkRemovedLeafMembership.root <== root;
    checkRemovedLeafMembership.leaf <== removedLeaf;
    checkRemovedLeafMembership.index <== removedLeafIndex;
    checkRemovedLeafMembership.hashPath <== removedLeafHashPath;

    // Construct a root for a Merkle tree that replaces the removed leaf with the last leaf.
    component constructTempRoot = ConstructRoot(levels);
    constructTempRoot.leaf <== lastLeaf;
    constructTempRoot.index <== removedLeafIndex;
    constructTempRoot.hashPath <== removedLeafHashPath;

    // Check that the Merkle branch supplied for the last leaf has a valid shape for the leaf to
    // indeed be the last non-null leaf in the deck.
    component checkLastLeaf = CheckLastLeaf(levels);
    checkLastLeaf.leaf <== lastLeaf;
    checkLastLeaf.index <== lastLeafIndex;
    checkLastLeaf.hashPath <== lastLeafHashPath;

    // Check that the Merkle branch supplied for the last leaf is congruent with the temporary root.
    component validatePath = CheckMembership(levels);
    validatePath.root <== constructTempRoot.root;
    validatePath.leaf <== lastLeaf;
    validatePath.index <== lastLeafIndex;
    validatePath.hashPath <== lastLeafHashPath;

    // Check that the new root is obtained by replacing the last leaf with a null leaf.
    component checkNewRoot = CheckMembership(levels);
    checkNewRoot.root <== newRoot;
    checkNewRoot.leaf <== 255;
    checkNewRoot.index <== index;
    checkNewRoot.hashPath <== lastLeafHashPath;
}

// TODO this is distinct, move it to its own file
// Checks a Merkle root given its leaves.
template CheckMerkleRoot(levels) {
    signal input root;
    signal input leaves[2**levels];

    // Container for the Merkle tree flattened into an array
    // (children of index i live at 2*i and 2*i + 1).
    var flattenedTree[2**(levels+1)];
    // Fill in the leaves.
    for (var i = 0; i < 2**levels; i++) {
        flattenedTree[2**levels+i] = leaves[i];
    }

    component hashers[(2**levels)];
    for (var i = 2**levels -1; i > 0; i--) {
        hashers[i] = HashLeftRight();
        hashers[i].left <== flattenedTree[2*i];
        hashers[i].right <== flattenedTree[2*i + 1];
        flattenedTree[i] = hashers[i].hash;
    }

    root === flattenedTree[1];
}