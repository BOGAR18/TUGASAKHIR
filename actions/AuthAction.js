import { Alert } from "react-native";
import FIREBASE from "./config/FIREBASE";
import { clearStorage, getData, storeData } from "../utils";

// Fungsi menyimpan log aktivitas
const saveLog = async (name, type, status) => {
  try {
    const timestamp = Date.now();
    await FIREBASE.database().ref(`logs/${timestamp}`).set({
      name,
      type, // "login" atau "logout"
      status, // admin, pegawai, atau user
      timestamp: new Date().toISOString(),
    });
    console.log(`Log ${type} berhasil disimpan untuk ${name}`);
  } catch (error) {
    console.error("Gagal menyimpan log:", error);
  }
};

// Fungsi logout dengan acuan logika login
export const logoutUser = async (navigation) => {
  try {
    const userData = await getData("user"); // Mengambil data pengguna yang login
    if (userData) {
      console.log("Sedang logout user:", userData.email);

      // Simpan log logout
      await saveLog(userData.name, "logout", userData.status);

      // Logout dari Firebase
      await FIREBASE.auth().signOut();
      console.log("User berhasil logout dari Firebase");

      // Hapus data lokal
      await clearStorage();

      // Arahkan ke halaman login
      navigation.replace("Login");
    } else {
      console.log("Tidak ada pengguna yang sedang login.");
      navigation.replace("Login");
    }
  } catch (error) {
    console.error("Error saat logout:", error);
    alert("Error saat logout: " + error.message);
  }
};

// Fungsi login
export const loginUser = async (email, password) => {
  try {
    const success = await FIREBASE.auth().signInWithEmailAndPassword(email, password);
    const uid = success.user.uid;

    // Ambil data user dari Firebase
    const userRef = FIREBASE.database().ref(`/users/${uid}`);
    const userSnapshot = await userRef.once("value");
    const userData = userSnapshot.val();

    if (userData) {
      await storeData("user", userData);

      // Simpan log aktivitas login
      await saveLog(userData.name, "login", userData.status);

      return userData;
    } else {
      throw new Error("User data not found");
    }
  } catch (error) {
    throw error;
  }
};


export const registerUser = async (data, password) => {
  try {
    const success = await FIREBASE.auth().createUserWithEmailAndPassword(
      data.email,
      password
    );
    const dataBaru = { ...data, uid: success.user.uid };

    // Simpan hanya ke database, TANPA mengubah sesi user yang sedang login
    await FIREBASE.database().ref("users/" + success.user.uid).set(dataBaru);

    return dataBaru;
  } catch (error) {
    Alert.alert("Registration Error", error.message);
    throw error;
  }
};


// Update Data User
export const updateUserData = async (uid, updatedData) => {
  try {
    const userRef = FIREBASE.database().ref(`users/${uid}`);
    const snapshot = await userRef.once("value");
    const existingUserData = snapshot.val();

    if (existingUserData) {
      const updatedUser = { ...existingUserData, ...updatedData };
      await userRef.update(updatedUser);
      console.log("User data updated successfully");
      return updatedUser;
    } else {
      throw new Error("User data not found");
    }
  } catch (error) {
    Alert.alert("Update Error", error.message);
    throw error;
  }
};

// Ambil Data Barang Keluar
export const getBarang_KeluarData = async () => {
  try {
    const barangRef = FIREBASE.database().ref("BarangKeluar");
    const snapshot = await barangRef.once("value");
    const data = snapshot.val();

    if (data) {
      console.log("Data retrieved successfully:", data);
      return data;
    } else {
      console.log("No data available");
      return null;
    }
  } catch (error) {
    console.error("Error retrieving data: ", error);
    throw error;
  }
};
