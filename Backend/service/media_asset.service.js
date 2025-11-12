const { MediaAsset } = require("../model");

class MediaAssetService {
  /**
   * @param {import("./types").MediaAsset[]} assets
   * @returns {string[]} The inserted asset's ids
   */
  async saveMediaAsset(assets) {
    const newAssets = await MediaAsset.insertMany(
      assets.map((asset) => ({
        publicId: asset.publicId,
        url: asset.url,
        kind: asset.kind
      }))
    );

    return newAssets.map(a => a._id);
  }
}

module.exports = {
  MediaAssetService: new MediaAssetService
};
