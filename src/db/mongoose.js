import mongoose from "mongoose";
export default mongoose.connect(process.env.CONNECTION_URL);
