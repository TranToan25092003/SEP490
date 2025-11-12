const { Bay } = require("../model");

const mapBayToDTO = (bay) => {
  return {
    id: bay._id,
    bayNumber: bay.bay_number,
    description: bay.description,
  };
}

class BayService {
  async getAllBays() {
    const bays = await Bay.find().exec();
    return bays.map(mapBayToDTO);
  }
}

module.exports = {
  BayService: new BayService(),
}
