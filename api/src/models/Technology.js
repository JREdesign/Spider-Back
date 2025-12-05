import mongoose from 'mongoose';

const technologySchema = new mongoose.Schema({
    technology: { type: String, required: true, unique: true }
});

const TechnologyModel = mongoose.model('Technology', technologySchema);

export default TechnologyModel;
