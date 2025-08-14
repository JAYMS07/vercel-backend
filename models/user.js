import mongoose from "mongoose";
import { Schema ,model} from "mongoose";

// Define the user schema
// This schema will be used to create a User model
const UserSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
});

const UserModel = model("User", UserSchema);

export default UserModel;
