import admin from "../config/firebaseAdmin";

const db = admin.firestore();

export const getRegisteredVehicle = async (req, res) => {
  try {
    const { userId } = req.params;
    const vehicleSnapshot = await db
      .collection("vehicles")
      .where("userId", "==", userId)
      .get();
    const vehicles = vehicleSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
