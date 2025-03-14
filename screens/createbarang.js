import React, { useState, useEffect } from "react";
import { ScrollView, ActivityIndicator } from "react-native";
import {
  Box,
  Button,
  Text,
  VStack,
  Input,
  Select,
  FormControl,
  HStack,
  Modal,
  Pressable,
  IconButton,
  Icon,
  Divider,
  useTheme,
  Heading,
  Badge,
  Center,
} from "native-base";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import FIREBASE from "../actions/config/FIREBASE";
import Header from "../components/header";
import * as DocumentPicker from "expo-document-picker";
import { getData } from "../utils";

const CreateBarang = ({ navigation }) => {
  const [items, setItems] = useState([
    {
      id: 1,
      namaBarang: "",
      kodeBarang: "",
      jenisBarang: "",
      jumlahBarang: "",
    },
  ]);
  const [formData, setFormData] = useState({
    tanggalPeminjaman: "",
    Id_Kategori_Peminjaman: "",
    tanggalKembali: "",
  });

  // State untuk menampilkan/menyembunyikan date picker
  const [showTanggalPeminjaman, setShowTanggalPeminjaman] = useState(false);
  const [showTanggalKembali, setShowTanggalKembali] = useState(false);

  // State lainnya
  const [barangOptions, setBarangOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState("");
  const [fileSurat, setFileSurat] = useState(null);
  const [user, setUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const Id_Kategori_PeminjamanOptions = [
    { id: "Insidentil", name: "Insidentil" },
    { id: "Reguler", name: "Reguler" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const barangMasukData = await getBarangMasuk();
      const returBarangData = await getReturBarang();

      const combinedData = [
        ...barangMasukData.map((item) => ({ ...item, source: "masuk" })),
        ...returBarangData.map((item) => ({ ...item, source: "retur" })),
      ];

      setBarangOptions(combinedData);
      setLoading(false);
    };

    fetchData();
    getUserData();
  }, []);

  const getBarangMasuk = async () => {
    try {
      const userRef = FIREBASE.database().ref("barang_masuk");
      const snapshot = await userRef.once("value");
      const barangMasukData = snapshot.val();

      if (barangMasukData) {
        const acceptedBarang = [];

        Object.values(barangMasukData).forEach((item) => {
          if (item.barang && Array.isArray(item.barang)) {
            const filteredBarang = item.barang.filter(
              (barangItem) => barangItem.Status === "Accept"
            );
            if (filteredBarang.length > 0) {
              acceptedBarang.push(...filteredBarang);
            }
          }
        });
        return acceptedBarang;
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error fetching barang masuk data:", error);
      showModal("Error", "Terjadi kesalahan saat mengambil data barang masuk.");
      return [];
    }
  };

  const getReturBarang = async () => {
    try {
      const returRef = FIREBASE.database().ref("Retur_Barang");
      const snapshot = await returRef.once("value");
      const returBarangData = snapshot.val();

      if (returBarangData) {
        const returBarang = [];

        Object.values(returBarangData).forEach((item) => {
          if (item.Kategori_Retur === "Bekas Handal") {
            returBarang.push(item);
          }
        });
        return returBarang;
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error fetching retur barang data:", error);
      showModal("Error", "Terjadi kesalahan saat mengambil data retur barang.");
      return [];
    }
  };

  const getUserData = async () => {
    try {
      const userData = await getData("user");

      if (userData) {
        const userRef = FIREBASE.database().ref(`users/${userData.uid}`);
        const snapshot = await userRef.once("value");
        const updatedUserData = snapshot.val();

        if (updatedUserData) {
          setUser(updatedUserData);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      showModal("Error", "Terjadi kesalahan saat mengambil data pengguna.");
    }
  };

  const pickDocument = async () => {
    try {
      let result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });

      if (result && !result.canceled) {
        const selectedFile = result.assets ? result.assets[0] : result;
        setFileSurat(selectedFile);
        showModal("File Terpilih", `File terpilih: ${selectedFile.name}`);
      } else {
        showModal("Error", "Tidak ada file yang dipilih.");
      }
    } catch (error) {
      console.error("Error picking document:", error);
      showModal("Error", "Terjadi kesalahan saat memilih file.");
    }
  };

  const uploadFileSurat = async (barang_keluar_id, fileSurat) => {
    if (fileSurat) {
      try {
        const response = await fetch(fileSurat.uri);
        const blob = await response.blob();

        const fileName = `${barang_keluar_id}_${fileSurat.name}`;
        const reference = FIREBASE.storage().ref(`surat_jalan/${fileName}`);

        await reference.put(blob);

        const downloadURL = await reference.getDownloadURL();
        return downloadURL;
      } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
      }
    }
    return null;
  };

  const addBarang_Keluar = async () => {
    if (
      !formData.tanggalPeminjaman ||
      !formData.Id_Kategori_Peminjaman ||
      (formData.Id_Kategori_Peminjaman === "Insidentil" &&
        !formData.tanggalKembali) ||
      items.some((item) => !item.namaBarang || !item.jumlahBarang)
    ) {
      setFormError("Semua field wajib diisi.");
      setModalVisible(true);
      setModalMessage("Semua field wajib diisi.");
      return;
    }

    setIsSaving(true); // Show loading spinner and disable button

    try {
      const newRef = FIREBASE.database().ref("Barang_Keluar").push();
      const barang_keluar_id = newRef.key;

      const fileSuratURL = await uploadFileSurat(barang_keluar_id, fileSurat);

      const data = {
        id: barang_keluar_id,
        userId: user.uid,
        tanggal_peminjamanbarang: formData.tanggalPeminjaman || null,
        Kategori_Peminjaman: formData.Id_Kategori_Peminjaman,
        No_SuratJalanBK: "",
        File_BeritaAcara: "",
        Nama_PihakPeminjam: user.name || "",
        Catatan: "",
        Tanggal_PengembalianBarang: formData.tanggalKembali || null,
        File_Surat: fileSuratURL,
        status: "Pending",
        barang: items.map((item) => {
          const selectedBarang = barangOptions.find(
            (option) => option.kode_barang === item.kodeBarang
          );
          const barang_id = FIREBASE.database().ref().push().key;
          return {
            id: barang_id,
            nama_barang: item.namaBarang || null,
            kode_barang: item.kodeBarang || null,
            jenis_barang: item.jenisBarang || null,
            kategori_barang: item.kategoriBarang || null,
            jumlah_barang: item.jumlahBarang || null,
            garansi_barang_awal: selectedBarang
              ? selectedBarang.garansi_barang_awal || null
              : null,
            garansi_barang_akhir: selectedBarang
              ? selectedBarang.garansi_barang_akhir || null
              : null,
          };
        }),
      };

      await newRef.set(data);

      // const sendBarangKeluarNotification = async (user) => {
      //   const notificationData = {
      //     title: "Pending Pengajuan Barang Keluar",
      //     message: `Pengajuan Barang dari ${user.name} berhasil, menunggu konfirmasi dari admin`,
      //     created_at: new Date().toISOString(),
      //     user_status: {
      //       [`user_2`]: { status: "unread" },
      //       [`admin_1`]: { status: "unread" },
      //     },
      //   };

      //   await FIREBASE.database().ref("notifications").push(notificationData);
      // };

      // sendBarangKeluarNotification(user);

      showModal("Berhasil", "Barang berhasil diajukan.");
      navigation.goBack();
    } catch (error) {
      console.error("Error saving data:", error);
      showModal("Error", "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSaving(false); // Hide loading spinner and enable button again
    }
  };

  const handleTanggalPeminjamanChange = (event, selectedDate) => {
    setShowTanggalPeminjaman(false);
    if (selectedDate) {
      // Format the date as YYYY-MM-DD
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setFormData((prevState) => ({
        ...prevState,
        tanggalPeminjaman: formattedDate,
        // Reset tanggalKembali if the new peminjaman date is after it
        tanggalKembali:
          prevState.tanggalKembali &&
          new Date(prevState.tanggalKembali) < selectedDate
            ? null
            : prevState.tanggalKembali,
      }));
    }
  };

  const handleTanggalKembaliChange = (event, selectedDate) => {
    setShowTanggalKembali(false);
    if (selectedDate) {
      // Format the date as YYYY-MM-DD
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setFormData((prevState) => ({
        ...prevState,
        tanggalKembali: formattedDate,
      }));
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: items.length + 1,
        namaBarang: "",
        kodeBarang: "",
        jenisBarang: "",
        jumlahBarang: "",
      },
    ]);
  };

  const handleDeleteItem = (index) => {
    setItemToDelete(index);
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = () => {
    if (itemToDelete !== null) {
      const newItems = items.filter((_, index) => index !== itemToDelete);
      setItems(newItems);
      setDeleteConfirmVisible(false);
      setItemToDelete(null);
    }
  };

  const handleInputChange = (index, name, value) => {
    const newItems = [...items];

    if (index >= 0 && index < newItems.length) {
      if (name === "namaBarang") {
        const selectedBarang = barangOptions.find(
          (option) => option.kode_barang === value
        );
        if (selectedBarang) {
          newItems[index].namaBarang = selectedBarang.nama_barang;
          newItems[index].kodeBarang = selectedBarang.kode_barang;
          newItems[index].jenisBarang = selectedBarang.jenis_barang;
          newItems[index].kategoriBarang = selectedBarang.kategori_barang;
          newItems[index].jumlahBarang = "";
          newItems[index].maxJumlahBarang = selectedBarang.jumlah_barang; // Store max stock
        }
      } else if (name === "jumlahBarang") {
        const maxJumlahBarang = newItems[index].maxJumlahBarang;
        if (Number(value) > maxJumlahBarang) {
          showModal(
            "Error",
            `Jumlah barang yang diinput melebihi stok yang tersedia. Jumlah maksimal yang dapat diinput adalah ${maxJumlahBarang} unit.`
          );
          newItems[index].jumlahBarang = maxJumlahBarang.toString(); // Set to max quantity available
        } else {
          newItems[index].jumlahBarang = value; // Valid input
        }
      } else {
        newItems[index][name] = value;
      }

      setItems(newItems);
    } else {
      console.error(
        `Item dengan indeks ${index} tidak ditemukan di array items.`
      );
    }
  };

  const showModal = (title, message) => {
    setModalMessage(message);
    setModalVisible(true);
  };

  return (
    <>
      <Header title={"Pengajuan Barang"} withBack={true} />
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <Box
          w="full"
          bgColor={"blue.500"}
          p={6}
          borderRadius="2xl"
          shadow={4}
          mb={6}
        >
          <HStack alignItems="center" space={3}>
            <Icon as={MaterialIcons} name="inventory" size={8} color="white" />
            <VStack>
              <Text color="white" fontSize="lg" fontWeight="bold">
                Form Pengajuan Barang
              </Text>
              <Text color="white" opacity={0.8}>
                Silakan isi detail pengajuan barang
              </Text>
            </VStack>
          </HStack>
        </Box>

        {/* Main Form Container */}
        <Box bg="white" borderRadius="2xl" shadow={2} p={5} mb={6}>
          <VStack space={5}>
            {/* Kategori Pengajuan */}
            <FormControl>
              <FormControl.Label _text={{ fontWeight: "bold" }}>
                Kategori Pengajuan
              </FormControl.Label>
              <Select
                selectedValue={formData.Id_Kategori_Peminjaman}
                onValueChange={(value) =>
                  setFormData({ ...formData, Id_Kategori_Peminjaman: value })
                }
                placeholder="Pilih Kategori Pengajuan"
                borderRadius="lg"
                borderWidth={1.5}
                py={3}
                isReadOnly={true} // Mencegah perubahan langsung
                _selectedItem={{
                  bg: "blue.100",
                  endIcon: <Icon as={MaterialIcons} name="check" size={5} />,
                }}
              >
                {Id_Kategori_PeminjamanOptions.map((option) => (
                  <Select.Item
                    key={option.id}
                    label={option.name}
                    value={option.id}
                  />
                ))}
              </Select>
            </FormControl>

            {/* Tanggal Pengajuan */}
            <FormControl>
              <FormControl.Label _text={{ fontWeight: "bold" }}>
                Tanggal Pengajuan
              </FormControl.Label>
              <Pressable onPress={() => setShowTanggalPeminjaman(true)}>
                <Input
                  placeholder="Pilih Tanggal Pengajuan"
                  value={formData.tanggalPeminjaman || ""}
                  isReadOnly={true} // Mencegah keyboard muncul
                  borderRadius="lg"
                  borderWidth={1.5}
                  py={3}
                  InputLeftElement={
                    <Icon
                      as={MaterialIcons}
                      name="date-range"
                      size={5}
                      ml={3}
                      color="gray.400"
                    />
                  }
                  InputRightElement={
                    <Icon
                      as={MaterialIcons}
                      name="calendar-today"
                      size={5}
                      mr={3}
                      color="blue.500"
                    />
                  }
                />
              </Pressable>

              {showTanggalPeminjaman && (
                <DateTimePicker
                  value={
                    formData.tanggalPeminjaman
                      ? new Date(formData.tanggalPeminjaman)
                      : new Date()
                  }
                  mode="date"
                  display="default"
                  onChange={handleTanggalPeminjamanChange}
                />
              )}
            </FormControl>

            {/* Tanggal Kembali (Kondisional untuk Insidentil) */}
            {formData.Id_Kategori_Peminjaman === "Insidentil" && (
              <FormControl>
                <FormControl.Label _text={{ fontWeight: "bold" }}>
                  Tanggal Kembali
                </FormControl.Label>
                <Pressable onPress={() => setShowTanggalKembali(true)}>
                  <Input
                    placeholder="Pilih Tanggal Kembali"
                    value={formData.tanggalKembali || ""}
                    isReadOnly={true} // Mencegah keyboard muncul
                    borderRadius="lg"
                    borderWidth={1.5}
                    py={3}
                    InputLeftElement={
                      <Icon
                        as={MaterialIcons}
                        name="calendar-today"
                        size={5}
                        ml={3}
                        color="gray.400"
                      />
                    }
                    InputRightElement={
                      <Icon
                        as={MaterialIcons}
                        name="calendar-today"
                        size={5}
                        mr={3}
                        color="blue.500"
                      />
                    }
                  />
                </Pressable>

                {showTanggalKembali && (
                  <DateTimePicker
                    value={
                      formData.tanggalKembali
                        ? new Date(formData.tanggalKembali)
                        : new Date()
                    }
                    mode="date"
                    display="default"
                    minimumDate={
                      formData.tanggalPeminjaman
                        ? new Date(formData.tanggalPeminjaman)
                        : undefined
                    }
                    onChange={handleTanggalKembaliChange}
                  />
                )}
              </FormControl>
            )}
            {/* Upload Surat Section */}
            <FormControl>
              <FormControl.Label _text={{ fontWeight: "bold" }}>
                Upload Surat Jalan (PDF)
              </FormControl.Label>
              <Pressable
                onPress={pickDocument}
                bg="gray.50"
                borderRadius="lg"
                borderWidth={1.5}
                borderStyle="dashed"
                borderColor="gray.300"
                p={4}
              >
                <Center>
                  <Icon
                    as={MaterialIcons}
                    name="upload-file"
                    size={10}
                    color="gray.400"
                    mb={2}
                  />
                  <Text color="gray.500" fontWeight="medium">
                    {fileSurat ? fileSurat.name : "Pilih file PDF"}
                  </Text>
                  {fileSurat && (
                    <Badge colorScheme="success" mt={2}>
                      File terpilih
                    </Badge>
                  )}
                </Center>
              </Pressable>
            </FormControl>
          </VStack>
        </Box>

        {/* Barang List Section */}
        {barangOptions.length > 0 ? (
          items.map((item, index) => (
            <Box
              key={index}
              bg="white"
              p={5}
              borderRadius="2xl"
              shadow={2}
              mb={4}
            >
              <HStack justifyContent="space-between" alignItems="center" mb={4}>
                <Heading size="sm">Barang {index + 1}</Heading>
                <HStack space={2} alignItems="center">
                  <Badge colorScheme="blue" variant="subtle" rounded="lg">
                    {item.kategoriBarang || "Belum dipilih"}
                  </Badge>
                  {index > 0 && (
                    <IconButton
                      icon={
                        <Icon
                          as={MaterialIcons}
                          name="delete"
                          color="red.500"
                        />
                      }
                      onPress={() => handleDeleteItem(index)}
                      variant="ghost"
                      _pressed={{ bg: "red.100" }}
                    />
                  )}
                </HStack>
              </HStack>

              {/* Nama Barang Select */}
              <FormControl mb={4}>
                <FormControl.Label _text={{ fontWeight: "bold" }} >
                  Nama Barang
                </FormControl.Label>
                <Select
                  selectedValue={item.kodeBarang}
                  onValueChange={(value) =>
                    handleInputChange(index, "namaBarang", value)
                  }
                  placeholder="Pilih Nama Barang"
                  borderRadius="lg"
                  borderWidth={1.5}
                  py={3}
                  isReadOnly={true} // Prevent direct editing
                  _selectedItem={{
                    bg: "blue.100",
                    endIcon: <Icon as={MaterialIcons} name="check" size={5} />,
                  }}
                >
                  {barangOptions.map((option) => (
                    <Select.Item
                      key={`${option.source}-${option.kode_barang}`}
                      label={`${option.nama_barang} - ${
                        option.kategori_barang
                      } - ${option.jumlah_barang} unit ${
                        option.Kategori_Retur
                          ? `(${option.Kategori_Retur})`
                          : "(Baru)"
                      }`}
                      value={option.kode_barang}
                    />
                  ))}
                </Select>
              </FormControl>

              {/* Kode dan Jenis Barang */}
              <HStack space={4} mb={4}>
                <FormControl flex={1}>
                  <FormControl.Label _text={{ fontWeight: "bold" }}>
                    Kode Barang
                  </FormControl.Label>
                  <Input
                    value={item.kodeBarang}
                    isReadOnly={true} // Prevent keyboard
                    bg="gray.50"
                    borderRadius="lg"
                    borderWidth={1.5}
                    py={3}
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormControl.Label _text={{ fontWeight: "bold" }}>
                    Jenis Barang
                  </FormControl.Label>
                  <Input
                    value={item.jenisBarang}
                    isReadOnly={true} // Prevent keyboard
                    bg="gray.50"
                    borderRadius="lg"
                    borderWidth={1.5}
                    py={3}
                  />
                </FormControl>
              </HStack>

              {/* Kategori Barang */}
              <FormControl mb={4}>
                <FormControl.Label _text={{ fontWeight: "bold" }}>
                  Kategori Barang
                </FormControl.Label>
                <Input
                  value={item.kategoriBarang}
                  isReadOnly={true} // Prevent keyboard
                  bg="gray.50"
                  borderRadius="lg"
                  borderWidth={1.5}
                  py={3}
                />
              </FormControl>

              {/* Jumlah Barang */}
              <FormControl>
                <FormControl.Label _text={{ fontWeight: "bold" }}>
                  Jumlah Barang
                </FormControl.Label>
                <Input
                  type="number"
                  value={item.jumlahBarang.toString()}
                  onChangeText={(value) =>
                    handleInputChange(index, "jumlahBarang", value)
                  }
                  placeholder="Masukkan Jumlah Barang"
                  keyboardType="numeric"
                  borderRadius="lg"
                  borderWidth={1.5}
                  py={3}
                  InputRightElement={
                    <Text mr={3} color="gray.400">
                      unit
                    </Text>
                  }
                />
              </FormControl>
            </Box>
          ))
        ) : (
          <Center bg="white" p={8} borderRadius="2xl" shadow={2}>
            <Icon
              as={MaterialIcons}
              name="inventory-2"
              size={12}
              color="gray.300"
              mb={4}
            />
            <Text color="gray.500" fontSize="md" textAlign="center">
              Tidak ada barang tersedia
            </Text>
          </Center>
        )}

        {/* Action Buttons */}
        <VStack space={3} mb={8} mt={4}>
          <Button
            onPress={handleAddItem}
            leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
            colorScheme="blue"
            _text={{ fontWeight: "bold" }}
            py={4}
            borderRadius="lg"
          >
            Tambah Barang
          </Button>

          <Button
            onPress={addBarang_Keluar}
            isDisabled={isSaving}
            colorScheme="green"
            _text={{ fontWeight: "bold" }}
            py={4}
            borderRadius="lg"
          >
            {isSaving ? (
              <HStack space={2} alignItems="center">
                <ActivityIndicator color="white" />
                <Text color="white" fontWeight="bold">
                  Menyimpan...
                </Text>
              </HStack>
            ) : (
              <HStack space={2} alignItems="center">
                <Icon as={MaterialIcons} name="check-circle" size="sm" />
                <Text color="white" fontWeight="bold">
                  Simpan Pengajuan
                </Text>
              </HStack>
            )}
          </Button>
        </VStack>

        {/* Footer Note */}
        <Center mb={6}>
          <HStack space={2} alignItems="center">
            <Icon
              as={Ionicons}
              name="information-circle"
              size={5}
              color="gray.500"
            />
            <Text color="gray.600" fontSize="sm" fontWeight="medium">
              Harap mengisi data dengan benar
            </Text>
          </HStack>
        </Center>
      </ScrollView>

      {/* Modal */}
      <Modal isOpen={modalVisible} onClose={() => setModalVisible(false)}>
        <Modal.Content borderRadius="xl">
          <Modal.CloseButton />
          <Modal.Header borderBottomWidth={0}>Informasi</Modal.Header>
          <Modal.Body>
            <Text>{modalMessage}</Text>
          </Modal.Body>
          <Modal.Footer borderTopWidth={0}>
            <Button
              onPress={() => setModalVisible(false)}
              colorScheme="blue"
              borderRadius="lg"
              _text={{ fontWeight: "bold" }}
            >
              Ok
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmVisible}
        onClose={() => setDeleteConfirmVisible(false)}
      >
        <Modal.Content borderRadius="xl">
          <Modal.CloseButton />
          <Modal.Header borderBottomWidth={0}>Konfirmasi Hapus</Modal.Header>
          <Modal.Body>
            <Text>
              Yakin ingin menghapus barang{" "}
              {itemToDelete !== null ? itemToDelete + 1 : ""}?
            </Text>
          </Modal.Body>
          <Modal.Footer borderTopWidth={0}>
            <Button.Group space={2}>
              <Button
                variant="ghost"
                onPress={() => setDeleteConfirmVisible(false)}
                borderRadius="lg"
                _text={{ fontWeight: "bold" }}
              >
                Batal
              </Button>
              <Button
                colorScheme="red"
                onPress={confirmDelete}
                borderRadius="lg"
                _text={{ fontWeight: "bold" }}
              >
                Hapus
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </>
  );
};

export default CreateBarang;
