import React, { useState, useEffect } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  FormControl,
  Input,
  TextArea,
  Button,
  ScrollView,
  StatusBar,
  Heading,
  useToast,
  Center,
  Spinner,
  IconButton,
  Icon,
  KeyboardAvoidingView,
  Divider,
  Select,
  Badge,
  Pressable,
} from "native-base";
import { Platform, ActivityIndicator } from "react-native";
import { MaterialIcons, Feather, FontAwesome5 } from "@expo/vector-icons";
import moment from "moment";
import "moment/locale/id";
import { getDatabase, ref, onValue, update, get } from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import RNHTMLtoPDF from "react-native-html-to-pdf";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { decode, encode } from "base-64";

// Set locale to Indonesian
moment.locale("id");

const BeritaAcara = ({ route, navigation }) => {
  const { id } = route.params;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [barangKeluar, setBarangKeluar] = useState(null);
  const [nextNumber, setNextNumber] = useState("001");
  const [formData, setFormData] = useState({
    Catatan: "",
    tanggal_peminjamanbarang: moment().format("YYYY-MM-DD"),
    Tanggal_PengembalianBarang: "",
  });
  
  const toast = useToast();
  
  // Color scheme
  const primaryColor = "rgb(1, 1, 95)";
  const accentColor = "#3498db";
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const database = getDatabase();
      
      // Get specific barang keluar
      const barangKeluarRef = ref(database, `Barang_Keluar/${id}`);
      const snapshot = await get(barangKeluarRef);
      const data = snapshot.val();
      
      if (data) {
        setBarangKeluar(data);
        
        // Set form data
        setFormData({
          ...formData,
          Nama_PihakPeminjam: data.Nama_PihakPeminjam || "",
          tanggal_peminjamanbarang:
            data.tanggal_peminjamanbarang || moment().format("YYYY-MM-DD"),
          Tanggal_PengembalianBarang: data.Tanggal_PengembalianBarang || "",
        });
        
        // Get all barang keluar to determine next number
        const allBarangKeluarRef = ref(database, "Barang_Keluar");
        onValue(allBarangKeluarRef, (snapshot) => {
          const allData = snapshot.val();
          let maxNumber = "000";
          
          if (allData) {
            Object.values(allData).forEach((item) => {
              // Check category for the right counter
              const fieldToCheck =
                data.Kategori_Peminjaman?.toLowerCase() === "reguler"
                  ? "no_berita_acara_reguler"
                  : "no_berita_acara_insidentil";
                
              if (
                item[fieldToCheck] &&
                parseInt(item[fieldToCheck]) > parseInt(maxNumber)
              ) {
                maxNumber = item[fieldToCheck];
              }
            });
          }
          
          // Increment to next number
          const nextNum = String(parseInt(maxNumber) + 1).padStart(3, "0");
          setNextNumber(nextNum);
          setLoading(false);
        });
      } else {
        toast.show({
          title: "Error",
          description: "Data tidak ditemukan",
          status: "error",
          duration: 3000,
        });
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.show({
        title: "Error",
        description: "Gagal memuat data",
        status: "error",
        duration: 3000,
      });
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const generatePDF = async () => {
    try {
      // Format barang data
      const barangKeluarList = [];
      if (barangKeluar.barang && Array.isArray(barangKeluar.barang)) {
        barangKeluar.barang.forEach((item) => {
          barangKeluarList.push({
            Kode_Barang: item.kode_barang || "N/A",
            Nama_Barang: item.nama_barang || "N/A",
            Jumlah_Barang: item.jumlah_barang || "N/A",
            Kategori_Barang: item.kategori_barang || "N/A",
            Jenis_Barang: item.jenis_barang || "N/A",
          });
        });
      }
      
      // Create the No_SuratJalanBK
      const noBeritaAcara = nextNumber;
      const pembuat = "STI-JATIM";
      const kategori =
        barangKeluar.Kategori_Peminjaman?.toLowerCase() === "reguler"
          ? "REG"
          : "INS";
      const tahun = moment().format("YYYY");
      const bulan = moment().format("MM");
      
      const noSuratJalanBK = `${noBeritaAcara}/${pembuat}/${kategori}/${tahun}/${bulan}`;
      
      // Create HTML content based on category
      const isReguler =
        barangKeluar.Kategori_Peminjaman?.toLowerCase() === "reguler";
      
      let barangListHtml = "";
      barangKeluarList.forEach((item, index) => {
        barangListHtml += `
          <tr>
            <td style="text-align: center">${index + 1}</td>
            <td style="text-align: center">${item.Kode_Barang}</td>
            <td style="text-align: center">${item.Nama_Barang}</td>
            <td style="text-align: center">${item.Jumlah_Barang}</td>
            <td style="text-align: center">${item.Kategori_Barang}</td>
            <td style="text-align: center">${item.Jenis_Barang}</td>
          </tr>
        `;
      });
      
      const tanggalKeluar = moment().format("DD MMMM YYYY");
      const tanggalPeminjaman = moment(
        formData.tanggal_peminjamanbarang
      ).format("DD MMMM YYYY");
      const tanggalPengembalian = formData.Tanggal_PengembalianBarang
        ? moment(formData.Tanggal_PengembalianBarang).format("DD MMMM YYYY")
        : "";
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Berita Acara</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 5px; border: 1px solid #000; }
            h3 { text-align: center; padding-top: 20px; text-decoration: underline; }
            .center { text-align: center; }
            .header { margin-top: -15px; text-align: center; }
            .signature-table { width: 100%; margin-top: 100px; border: none; }
            .signature-table th, .signature-table td { border: none; text-align: center; }
          </style>
        </head>
        <body>
          PT PLN (Persero)<br/>
          Unit Induk Jawa Timur<br/>
          DIV STI Ops Jatim<br/>
          Perihal: Pengajuan Peminjaman Barang ${
            isReguler ? "Reguler" : "Insidentil"
          }<br/>
          
          <h3>BERITA ACARA SERAH TERIMA BARANG</h3>
          <p class="header">Nomor: ${noSuratJalanBK}</p>
          
          <p>
            Pada hari ini, Tanggal ${tanggalKeluar} telah diserahkan dari PT PLN (PERSERO)
            DIV STI OPS JATIM kepada ${
              formData.Nama_PihakPeminjam
            } dengan kategori peminjaman ${
        isReguler ? "Reguler" : "Insidentil"
      }.
            Tanggal peminjaman barang anda mulai berlaku pada tanggal ${tanggalPeminjaman}
            ${
              !isReguler && tanggalPengembalian
                ? ` hingga tanggal ${tanggalPengembalian}`
                : ""
            }.
            Berikut ini merupakan keterangan atau informasi barang yang anda pinjam dari PT PLN (PERSERO) DIV STI OPS JATIM
          </p>
          
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Kode Barang</th>
                <th>Nama Barang</th>
                <th>Kuantitas</th>
                <th>Kategori Barang</th>
                <th>Jenis Barang</th>
              </tr>
            </thead>
            <tbody>
              ${barangListHtml}
            </tbody>
          </table><br/>
          
          Catatan:<br/>
          ${formData.Catatan || "-"}<br/>
          
          <p>Demikian Berita Acara Serah Terima Barang ini dibuat untuk dipergunakan seperlunya.</p>
          
          <table class="signature-table">
            <tr>
              <th>Diserahkan Oleh</th>
              <th>Diterima Oleh</th>
            </tr>
            <tr>
               <td style="text-align: center;"><img src="../assets/qrcode.png" alt="" width="100px" height="100px"></td> 
              <td style="padding-top: 100px;"></td>
            </tr>
            <tr>
              <td style="width: 45%;"="center">PT PLN (PERSERO) DIV STI OPS JATIM</td>
              <td  style="text-transform: uppercase; width: 45%;">${
                formData.Nama_PihakPeminjam
              }</td>
            </tr>
          </table>
        </body>
        </html>
      `;
      
      // Generate PDF file
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });
      
      return { uri, noSuratJalanBK };
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.show({
        title: "Error",
        description: "Gagal membuat berita acara",
        status: "error",
        duration: 3000,
      });
      return null;
    }
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      
      // Validate required fields
      if (!formData.tanggal_peminjamanbarang) {
        toast.show({
          title: "Error",
          description: "Tanggal peminjaman barang wajib diisi",
          status: "error",
          duration: 3000,
        });
        setSubmitting(false);
        return;
      }
      
      // For Insidentil, require Tanggal_PengembalianBarang
      if (
        barangKeluar.Kategori_Peminjaman?.toLowerCase() === "insidentil" &&
        !formData.Tanggal_PengembalianBarang
      ) {
        toast.show({
          title: "Error",
          description:
            "Tanggal pengembalian barang wajib diisi untuk peminjaman insidentil",
          status: "error",
          duration: 3000,
        });
        setSubmitting(false);
        return;
      }
      
      // Generate PDF
      const result = await generatePDF();
      
      if (!result) {
        setSubmitting(false);
        return;
      }
      
      const { uri, noSuratJalanBK } = result;
      
      // Upload the PDF to Firebase Storage
      const storage = getStorage();
      const pdfFileName = `berita-acara/Berita_Acara_${id}.pdf`;
      
      // Convert file to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Upload to Firebase Storage
      const pdfRef = storageRef(storage, pdfFileName);
      await uploadBytes(pdfRef, blob);
      
      // Get the download URL
      const pdfUrl = await getDownloadURL(pdfRef);
      
      // Update Barang Keluar data in Firebase
      const database = getDatabase();
      const barangKeluarRef = ref(database, `Barang_Keluar/${id}`);
      
      const isReguler =
        barangKeluar.Kategori_Peminjaman?.toLowerCase() === "reguler";
      const updateData = {
        No_SuratJalanBK: noSuratJalanBK,
        [isReguler ? "no_berita_acara_reguler" : "no_berita_acara_insidentil"]:
          nextNumber,
        Nama_PihakPeminjam: formData.Nama_PihakPeminjam,
        tanggal_peminjamanbarang: formData.tanggal_peminjamanbarang,
        Catatan: formData.Catatan || "",
        Tanggal_Keluar_BeritaAcara: moment().format("YYYY-MM-DD"),
        File_BeritaAcara: pdfUrl,
        status: "Accepted",
      };
      
      // Add Tanggal_PengembalianBarang for Insidentil
      if (!isReguler) {
        updateData.Tanggal_PengembalianBarang =
          formData.Tanggal_PengembalianBarang;
      }
      
      // Update Firebase
      await update(barangKeluarRef, updateData);
      
      // Update stock in Barang Masuk
      await updateStockBarangMasuk(barangKeluar.barang);
      
      toast.show({
        title: "Sukses",
        description: "Berita acara berhasil dibuat",
        status: "success",
        duration: 3000,
      });
      
      // Navigate back to list
      navigation.replace("StafBarang");
    } catch (error) {
      console.error("Error saving berita acara:", error);
      toast.show({
        title: "Error",
        description: `Gagal menyimpan: ${error.message}`,
        status: "error",
        duration: 3000,
      });
      setSubmitting(false);
    }
  };

  const updateStockBarangMasuk = async (barangList) => {
    if (!barangList || !Array.isArray(barangList)) {
      console.log("No barang to update stock for");
      return;
    }
    
    const database = getDatabase();
    
    for (const barang of barangList) {
      const kodeBarang = barang.kode_barang;
      const jumlahBarang = parseInt(barang.jumlah_barang) || 0;
      
      if (!kodeBarang || jumlahBarang <= 0) continue;
      
      // Get all barang masuk
      const barangMasukRef = ref(database, "barang_masuk");
      const snapshot = await get(barangMasukRef);
      const barangMasukData = snapshot.val();
      
      // Find the matching item
      let found = false;
      
      for (const [entryKey, entry] of Object.entries(barangMasukData || {})) {
        if (!entry.barang || !Array.isArray(entry.barang)) continue;
        
        for (const [itemKey, item] of entry.barang.entries()) {
          if (item.kode_barang === kodeBarang) {
            found = true;
            const oldStock = parseInt(item.jumlah_barang) || 0;
            const newStock = Math.max(0, oldStock - jumlahBarang);
            
            // Update stock
            await update(
              ref(database, `barang_masuk/${entryKey}/barang/${itemKey}`),
              {
                jumlah_barang: newStock,
              }
            );
            
            break;
          }
        }
        
        if (found) break;
      }
    }
  };

  if (loading) {
    return (
      <Center flex={1} bg="white">
        <Spinner size="lg" color={primaryColor} />
        <Text mt={4} color="gray.500">
          Memuat data...
        </Text>
      </Center>
    );
  }

  const isReguler =
    barangKeluar?.Kategori_Peminjaman?.toLowerCase() === "reguler";

  return (
    <KeyboardAvoidingView
      flex={1}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />

      {/* Header */}
      <Box bg={primaryColor} py={3} px={4} shadow={3}>
        <HStack alignItems="center" space={2}>
          <IconButton
            icon={
              <Icon
                as={MaterialIcons}
                name="arrow-back"
                color="white"
                size="md"
              />
            }
            onPress={() => navigation.goBack()}
            variant="unstyled"
            _pressed={{ opacity: 0.7 }}
            p={1}
          />
          <Heading color="white" size="md">
            Buat Berita Acara
          </Heading>
        </HStack>
      </Box>

      <ScrollView
        bg="gray.50"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack space={4} width="100%" p={4}>
          {/* Nomor Berita Acara Card */}
          <Box bg="white" p={4} rounded="lg" shadow={1}>
            <HStack alignItems="center" space={2} mb={3}>
              <Icon
                as={MaterialIcons}
                name="numbers"
                color={primaryColor}
                size="sm"
              />
              <Heading size="sm" color={primaryColor}>
                Nomor Berita Acara
              </Heading>
            </HStack>
            <Divider mb={3} />

            <HStack space={2} flexWrap="wrap">
              <FormControl flex={1} minW="100px" mb={2}>
                <FormControl.Label
                  _text={{ fontSize: "xs", fontWeight: "bold" }}
                >
                  Nomor
                </FormControl.Label>
                <Input
                  value={nextNumber}
                  isReadOnly
                  bg="gray.100"
                  textAlign="center"
                  borderColor="gray.300"
                  fontSize="md"
                  height={10}
                />
              </FormControl>

              <FormControl flex={1} minW="100px" mb={2}>
                <FormControl.Label
                  _text={{ fontSize: "xs", fontWeight: "bold" }}
                >
                  Pembuat
                </FormControl.Label>
                <Input
                  value="STI-JATIM"
                  isReadOnly
                  bg="gray.100"
                  textAlign="center"
                  borderColor="gray.300"
                  fontSize="md"
                  height={10}
                />
              </FormControl>

              <FormControl flex={1} minW="100px" mb={2}>
                <FormControl.Label
                  _text={{ fontSize: "xs", fontWeight: "bold" }}
                >
                  Kategori
                </FormControl.Label>
                <Input
                  value={isReguler ? "REG" : "INS"}
                  isReadOnly
                  bg="gray.100"
                  textAlign="center"
                  borderColor="gray.300"
                  fontSize="md"
                  height={10}
                />
              </FormControl>

              <FormControl flex={1} minW="50px" mb={2}>
                <FormControl.Label
                  _text={{ fontSize: "xs", fontWeight: "bold" }}
                >
                  Bulan
                </FormControl.Label>
                <Input
                  value={moment().format("MM")}
                  isReadOnly
                  bg="gray.100"
                  textAlign="center"
                  borderColor="gray.300"
                  fontSize="md"
                  height={10}
                />
              </FormControl>

              <FormControl flex={1} minW="80px" mb={2}>
                <FormControl.Label
                  _text={{ fontSize: "xs", fontWeight: "bold" }}
                >
                  Tahun
                </FormControl.Label>
                <Input
                  value={moment().format("YYYY")}
                  isReadOnly
                  bg="gray.100"
                  textAlign="center"
                  borderColor="gray.300"
                  fontSize="md"
                  height={10}
                />
              </FormControl>
            </HStack>
          </Box>

          {/* Informasi Peminjaman Card */}
          <Box bg="white" p={4} rounded="lg" shadow={1}>
            <HStack alignItems="center" space={2} mb={3}>
              <Icon
                as={MaterialIcons}
                name="info-outline"
                color={primaryColor}
                size="sm"
              />
              <Heading size="sm" color={primaryColor}>
                Informasi Peminjaman
              </Heading>
            </HStack>
            <Divider mb={3} />

            <FormControl mb={4}>
              <FormControl.Label _text={{ fontSize: "xs", fontWeight: "bold" }}>
                Nama Pihak Peminjam
              </FormControl.Label>
              <Input
                value={formData.Nama_PihakPeminjam}
                isReadOnly
                bg="gray.100"
                borderColor="gray.300"
                fontSize="md"
                height={10}
              />
            </FormControl>

            <FormControl mb={4}>
              <FormControl.Label _text={{ fontSize: "xs", fontWeight: "bold" }}>
                Tanggal Peminjaman
              </FormControl.Label>
              <Input
                type="date"
                value={formData.tanggal_peminjamanbarang}
                onChange={(e) =>
                  handleInputChange("tanggal_peminjamanbarang", e.target.value)
                }
                borderColor="gray.300"
                fontSize="md"
                height={10}
                _focus={{ borderColor: primaryColor, bg: "white" }}
              />
            </FormControl>

            {!isReguler && (
              <FormControl mb={4}>
                <FormControl.Label
                  _text={{ fontSize: "xs", fontWeight: "bold" }}
                >
                  Tanggal Pengembalian
                </FormControl.Label>
                <Input
                  type="date"
                  value={formData.Tanggal_PengembalianBarang}
                  onChange={(e) =>
                    handleInputChange(
                      "Tanggal_PengembalianBarang",
                      e.target.value
                    )
                  }
                  borderColor="gray.300"
                  fontSize="md"
                  height={10}
                  _focus={{ borderColor: primaryColor, bg: "white" }}
                />
              </FormControl>
            )}

            <FormControl>
              <FormControl.Label _text={{ fontSize: "xs", fontWeight: "bold" }}>
                Catatan
              </FormControl.Label>
              <TextArea
                value={formData.Catatan}
                onChangeText={(text) => handleInputChange("Catatan", text)}
                borderColor="gray.300"
                h={20}
                placeholder="Masukkan catatan jika ada"
                _focus={{ borderColor: primaryColor, bg: "white" }}
              />
            </FormControl>
          </Box>

          {/* Daftar Barang Card */}
          <Box bg="white" p={4} rounded="lg" shadow={1}>
            <HStack alignItems="center" space={2} mb={3}>
              <Icon
                as={MaterialIcons}
                name="inventory"
                color={primaryColor}
                size="sm"
              />
              <Heading size="sm" color={primaryColor}>
                Daftar Barang
              </Heading>
              <Badge colorScheme="blue" rounded="full" variant="subtle">
                {barangKeluar?.barang?.length || 0}
              </Badge>
            </HStack>
            <Divider mb={3} />

            {barangKeluar?.barang && barangKeluar.barang.length > 0 ? (
              <VStack space={2} divider={<Divider />}>
                {barangKeluar.barang.map((item, index) => (
                  <Pressable key={index} _pressed={{ opacity: 0.8 }}>
                    <HStack
                      justifyContent="space-between"
                      alignItems="center"
                      p={2}
                    >
                      <HStack space={2} alignItems="center" flex={3}>
                        <Center
                          bg="blue.100"
                          p={2}
                          rounded="full"
                          width={8}
                          height={8}
                        >
                          <Text
                            fontSize="xs"
                            fontWeight="bold"
                            color="blue.700"
                          >
                            {index + 1}
                          </Text>
                        </Center>
                        <VStack space={0}>
                          <Text
                            fontWeight="bold"
                            isTruncated
                            maxW="200"
                            fontSize="md"
                          >
                            {item.nama_barang}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Kode: {item.kode_barang || "-"}
                          </Text>
                        </VStack>
                      </HStack>
                      <HStack
                        space={2}
                        alignItems="center"
                        flex={1}
                        justifyContent="flex-end"
                      >
                        <Badge colorScheme="green" rounded="full">
                          {item.jumlah_barang} unit
                        </Badge>
                      </HStack>
                    </HStack>
                  </Pressable>
                ))}
              </VStack>
            ) : (
              <Center p={4}>
                <Icon
                  as={MaterialIcons}
                  name="inventory-2"
                  size="lg"
                  color="gray.300"
                />
                <Text color="gray.400" mt={2}>
                  Tidak ada barang
                </Text>
              </Center>
            )}
          </Box>

          {/* Action Button */}
          <Box mt={2} mb={6}>
            <Button
              bg={primaryColor}
              leftIcon={<Icon as={Feather} name="save" size="sm" />}
              onPress={handleSave}
              isLoading={submitting}
              isLoadingText="Menyimpan..."
              shadow={2}
              height={12}
              _text={{ fontWeight: "bold" }}
            >
              Simpan & Generate PDF
            </Button>
          </Box>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default BeritaAcara;