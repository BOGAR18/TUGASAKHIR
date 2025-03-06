import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  ScrollView,
  Badge,
  Icon,
  Pressable,
  Heading,
  Divider,
  Center,
  useToast,
  Spinner,
  FlatList,
  IconButton,
} from 'native-base';
import { 
  MaterialIcons, 
  FontAwesome5, 
  Ionicons,
  Feather,
  MaterialCommunityIcons
} from '@expo/vector-icons';
import { getDatabase, ref, onValue, update, get } from "firebase/database";
import moment from 'moment';
import 'moment/locale/id';
import { Linking, Share } from 'react-native';
import StafBarang from './staf-barang';

const StafBarangDetail = ({ route, navigation }) => {
  const { id } = route.params;
  const [barangKeluar, setBarangKeluar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const toast = useToast();

  // Color scheme
  const primaryColor = "#4361ee";
  const accentColor = "#3f37c9";

  // Set moment locale to Indonesian
  moment.locale('id');

  // Fetch specific Barang Keluar data
  const fetchBarangKeluarDetail = async () => {
    setLoading(true);
    try {
      const database = getDatabase();
      const barangKeluarRef = ref(database, `Barang_Keluar/${id}`);
      
      onValue(barangKeluarRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Process barang items to ensure consistent format
          let items = [];
          if (data.barang) {
            if (Array.isArray(data.barang)) {
              items = data.barang;
            } else {
              // If barang is an object, convert to array
              items = Object.values(data.barang);
            }
          }
          
          setBarangKeluar({
            id,
            ...data,
            items
          });
        } else {
          toast.show({
            title: "Error",
            description: "Data barang keluar tidak ditemukan",
            status: "error"
          });
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching Barang Keluar detail:", error);
        toast.show({
          title: "Error",
          description: "Gagal memuat detail barang keluar",
          status: "error"
        });
        setLoading(false);
      });
    } catch (error) {
      console.error("Fetch detail error:", error);
      toast.show({
        title: "Error",
        description: "Terjadi kesalahan saat memuat data",
        status: "error"
      });
      setLoading(false);
    }
  };

  // Create Berita Acara
  const createBeritaAcara = async () => {
    setProcessingAction(true);
    try {
      const database = getDatabase();
      const barangKeluarRef = ref(database, `Barang_Keluar/${id}`);
      
      // Prepare Berita Acara data
      const beritaAcaraData = {
        No_SuratJalanBK: generateBeritaAcaraNumber(),
        status: 'Accepted',
        File_BeritaAcara: 'generated_pdf_url', // In real app, generate and upload PDF
        Tanggal_Keluar_BeritaAcara: moment().format('YYYY-MM-DD')
      };

      // Update Barang Keluar with Berita Acara info
      await update(barangKeluarRef, beritaAcaraData);

      // Show success message
      toast.show({
        title: "Berhasil",
        description: "Berita acara berhasil dibuat",
        status: "success"
      });

      // Refresh data
      fetchBarangKeluarDetail();
    } catch (error) {
      console.error("Create Berita Acara error:", error);
      toast.show({
        title: "Error",
        description: "Gagal membuat berita acara",
        status: "error"
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Generate Berita Acara Number
  const generateBeritaAcaraNumber = () => {
    const currentDate = moment();
    return [
      id.slice(-3), // Last 3 digits of ID
      'STAF', // Pembuat
      barangKeluar?.Kategori_Peminjaman || 'GEN', // Kategori
      currentDate.format('YYYY'), // Tahun
      currentDate.format('MM') // Bulan
    ].join('/');
  };

  // Handle return (retur) process for an item
  const handleReturnItem = async (itemId) => {
    setProcessingAction(true);
    try {
      const database = getDatabase();
      const barangKeluarRef = ref(database, `Barang_Keluar/${id}`);
      
      // Get current data
      const snapshot = await get(barangKeluarRef);
      const currentData = snapshot.val();
      
      if (!currentData) {
        throw new Error("Data barang keluar tidak ditemukan");
      }
      
      // Find the specific barang to return
      let barangToReturn;
      let updatedBarang;
      
      if (Array.isArray(currentData.barang)) {
        barangToReturn = currentData.barang.find(b => b.id === itemId);
        // Mark the item as returned
        updatedBarang = currentData.barang.map(b => 
          b.id === itemId ? { ...b, status: 'dikembalikan' } : b
        );
      } else if (typeof currentData.barang === 'object') {
        // Find in object format
        const keys = Object.keys(currentData.barang);
        for (const key of keys) {
          if (currentData.barang[key].id === itemId) {
            barangToReturn = currentData.barang[key];
            break;
          }
        }
        
        // Create updated object
        updatedBarang = { ...currentData.barang };
        for (const key of keys) {
          if (updatedBarang[key].id === itemId) {
            updatedBarang[key] = { ...updatedBarang[key], status: 'dikembalikan' };
          }
        }
      }
      
      if (!barangToReturn) {
        throw new Error("Item tidak ditemukan");
      }
      
      // Update the barang in Barang Keluar
      await update(barangKeluarRef, { barang: updatedBarang });
      
      // Restore stock in Barang Masuk
      try {
        // Find and update the corresponding Barang Masuk
        const barangMasukRef = ref(database, 'barang_masuk');
        const barangMasukSnapshot = await get(barangMasukRef);
        const barangMasukData = barangMasukSnapshot.val();
        
        if (barangMasukData) {
          for (const key of Object.keys(barangMasukData)) {
            const entry = barangMasukData[key];
            if (entry.barang) {
              let barangList;
              if (Array.isArray(entry.barang)) {
                barangList = entry.barang;
              } else {
                barangList = Object.values(entry.barang);
              }
              
              const matchingBarangIndex = barangList.findIndex(
                b => b.kode_barang === barangToReturn.kode_barang
              );
              
              if (matchingBarangIndex !== -1) {
                // Update stock
                const updatedStock = parseInt(barangList[matchingBarangIndex].jumlah_barang) + 
                                    parseInt(barangToReturn.jumlah_barang);
                
                // Save updated data
                const updatePath = `barang_masuk/${key}/barang/${matchingBarangIndex}/jumlah_barang`;
                const updateRef = ref(database, updatePath);
                await update(updateRef, updatedStock);
                break;
              }
            }
          }
        }
      } catch (stockError) {
        console.error("Error updating stock:", stockError);
        // Continue even if stock update fails
      }

      // Show success message
      toast.show({
        title: "Berhasil",
        description: "Barang berhasil diretur",
        status: "success"
      });
      
      // Refresh data
      fetchBarangKeluarDetail();
    } catch (error) {
      console.error("Return process error:", error);
      toast.show({
        title: "Error",
        description: "Gagal memproses retur barang",
        status: "error"
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle opening PDF
  const handleViewPDF = (url) => {
    if (!url) {
      toast.show({
        title: "Error",
        description: "URL file tidak valid",
        status: "error"
      });
      return;
    }
    
    Linking.openURL(url).catch((err) => {
      toast.show({
        title: "Error",
        description: "Gagal membuka file PDF",
        status: "error"
      });
    });
  };

  // Handle sharing
  const handleShare = async () => {
    try {
      if (!barangKeluar) return;
      
      const message = `Detail Barang Keluar\n` +
        `Peminjam: ${barangKeluar.Nama_PihakPeminjam || 'Tidak ada'}\n` +
        `Kategori: ${barangKeluar.Kategori_Peminjaman || 'Tidak ada'}\n` +
        `Tanggal Peminjaman: ${formatDate(barangKeluar.tanggal_peminjamanbarang)}\n` +
        `Tanggal Pengembalian: ${formatDate(barangKeluar.Tanggal_PengembalianBarang)}\n` +
        `Status: ${barangKeluar.status === 'Accepted' ? 'Diterima' : 'Pending'}\n` +
        `Jumlah Barang: ${barangKeluar.items?.length || 0}`;
        
      await Share.share({
        message,
        title: 'Detail Barang Keluar',
      });
    } catch (error) {
      console.error("Share error:", error);
      toast.show({
        title: "Error",
        description: "Gagal membagikan data",
        status: "error"
      });
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Tidak ada tanggal";
    return moment(dateString).format('DD MMMM YYYY');
  };
  
  // Get status badge
  const StatusBadge = ({ status }) => {
    if (status === 'Accepted') {
      return (
        <Badge colorScheme="success" rounded="full">
          Diterima
        </Badge>
      );
    } else if (status === 'dikembalikan') {
      return (
        <Badge colorScheme="info" rounded="full">
          Dikembalikan
        </Badge>
      );
    } else {
      return (
        <Badge colorScheme="warning" rounded="full">
          Pending
        </Badge>
      );
    }
  };

  // Format item status
  const getItemStatus = (item) => {
    if (item.status === 'dikembalikan') {
      return (
        <Badge colorScheme="info" rounded="full" variant="subtle">
          Dikembalikan
        </Badge>
      );
    } else {
      return (
        <Badge colorScheme="green" rounded="full" variant="subtle">
          Dipinjam
        </Badge>
      );
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchBarangKeluarDetail();
  }, [id]);

  if (loading) {
    return (
      <Center flex={1} bg="coolGray.50">
        <VStack space={3} alignItems="center">
          <Spinner color={primaryColor} size="lg" />
          <Text color="coolGray.500">Memuat data...</Text>
        </VStack>
      </Center>
    );
  }

  if (!barangKeluar) {
    return (
      <Center flex={1} bg="coolGray.50">
        <VStack space={3} alignItems="center">
          <Icon 
            as={MaterialCommunityIcons}
            name="alert-circle-outline"
            size="6xl"
            color="coolGray.300"
          />
          <Text fontSize="lg" color="coolGray.500">Data tidak ditemukan</Text>
          <Button
            leftIcon={<Icon as={Ionicons} name="arrow-back" size="sm" />}
            onPress={() => navigation.goBack()}
            colorScheme="blue"
            mt={4}
          >
            Kembali
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box flex={1} bg="coolGray.50" safeArea>
      {/* Header */}
      <Box bg={primaryColor} px={4} pt={4} pb={6} borderBottomRadius="3xl" shadow={4}>
        <HStack justifyContent="space-between" alignItems="center" mb={4}>
          <IconButton
            icon={<Icon as={Ionicons} name="arrow-back" size="sm" color="white" />}
            borderRadius="full"
            variant="ghost"
            _icon={{ color: "white" }}
            onPress={() => navigation.goBack()}
          />
          <IconButton
            icon={<Icon as={Feather} name="share-2" size="sm" color="white" />}
            borderRadius="full"
            variant="ghost"
            _icon={{ color: "white" }}
            onPress={handleShare}
          />
        </HStack>
        
        <VStack>
          <HStack justifyContent="space-between" alignItems="center">
            <VStack>
              <Heading size="md" color="white" mb={1}>
                {barangKeluar.Nama_PihakPeminjam || "Tidak ada nama"}
              </Heading>
              <Text fontSize="sm" color="coolGray.100">
                {barangKeluar.Kategori_Peminjaman || "Kategori tidak ada"}
              </Text>
            </VStack>
            <StatusBadge status={barangKeluar.status} />
          </HStack>
          
          <HStack mt={4} space={6}>
            <VStack>
              <Text fontSize="xs" color="coolGray.100">ID Transaksi</Text>
              <Text fontSize="sm" color="white">{barangKeluar.id.slice(0, 8)}...</Text>
            </VStack>
            
            <VStack>
              <Text fontSize="xs" color="coolGray.100">Jumlah Barang</Text>
              <Text fontSize="sm" color="white">{barangKeluar.items?.length || 0} item</Text>
            </VStack>
          </HStack>
        </VStack>
      </Box>

      <ScrollView flex={1} px={4} pt={6}>
        {/* Tanggal Section */}
        <Box bg="white" p={4} rounded="xl" shadow={2} mb={4}>
          <Text fontSize="md" fontWeight="bold" color="coolGray.700" mb={3}>
            Informasi Peminjaman
          </Text>
          
          <VStack space={4}>
            <HStack justifyContent="space-between">
              <Text fontSize="sm" color="coolGray.500">Tanggal Peminjaman</Text>
              <Text fontSize="sm" fontWeight="medium" color="coolGray.700">
                {formatDate(barangKeluar.tanggal_peminjamanbarang)}
              </Text>
            </HStack>
            
            <HStack justifyContent="space-between">
              <Text fontSize="sm" color="coolGray.500">Tanggal Pengembalian</Text>
              <Text fontSize="sm" fontWeight="medium" color="coolGray.700">
                {formatDate(barangKeluar.Tanggal_PengembalianBarang)}
              </Text>
            </HStack>
            
            {barangKeluar.File_BeritaAcara && (
              <HStack justifyContent="space-between">
                <Text fontSize="sm" color="coolGray.500">Tanggal Berita Acara</Text>
                <Text fontSize="sm" fontWeight="medium" color="coolGray.700">
                  {formatDate(barangKeluar.Tanggal_Keluar_BeritaAcara)}
                </Text>
              </HStack>
            )}
            
            {barangKeluar.No_SuratJalanBK && (
              <HStack justifyContent="space-between">
                <Text fontSize="sm" color="coolGray.500">Nomor Surat Jalan</Text>
                <Text fontSize="sm" fontWeight="medium" color="coolGray.700">
                  {barangKeluar.No_SuratJalanBK}
                </Text>
              </HStack>
            )}
          </VStack>
        </Box>
        
        {/* Berita Acara Section */}
        {barangKeluar.status === 'Accepted' && (
          <Box bg="white" p={4} rounded="xl" shadow={2} mb={4}>
            <Text fontSize="md" fontWeight="bold" color="coolGray.700" mb={3}>
              Berita Acara
            </Text>
            
            {barangKeluar.File_BeritaAcara ? (
              <Button
                size="sm"
                colorScheme="blue"
                leftIcon={<Icon as={MaterialIcons} name="picture-as-pdf" size="sm" />}
                onPress={() => handleViewPDF(barangKeluar.File_BeritaAcara)}
                mb={2}
              >
                Lihat File Berita Acara
              </Button>
            ) : (
              <VStack space={2} alignItems="flex-start">
                <Text fontSize="sm" color="coolGray.500" mb={1}>
                  Belum ada berita acara untuk peminjaman ini
                </Text>
                <Button
                  size="sm"
                  colorScheme="blue"
                  leftIcon={<Icon as={FontAwesome5} name="file-alt" size="sm" />}
                  onPress={createBeritaAcara}
                  isLoading={processingAction}
                  isLoadingText="Memproses..."
                >
                  Buat Berita Acara
                </Button>
              </VStack>
            )}
            
            {barangKeluar.Catatan && (
              <Box bg="coolGray.50" p={3} rounded="lg" mt={3}>
                <Text fontSize="xs" color="coolGray.500" mb={1}>
                  Catatan
                </Text>
                <Text fontSize="sm" color="coolGray.700">
                  {barangKeluar.Catatan}
                </Text>
              </Box>
            )}
          </Box>
        )}
        
        {/* Daftar Barang Section */}
        <Box bg="white" p={4} rounded="xl" shadow={2} mb={4}>
          <HStack justifyContent="space-between" alignItems="center" mb={3}>
            <Text fontSize="md" fontWeight="bold" color="coolGray.700">
              Daftar Barang
            </Text>
            <Text fontSize="sm" color="coolGray.500">
              Total: {barangKeluar.items?.length || 0}
            </Text>
          </HStack>
          
          {barangKeluar.items && barangKeluar.items.length > 0 ? (
            <VStack space={3} divider={<Divider />}>
              {barangKeluar.items.map((item, index) => (
                <Box key={item.id || index}>
                  <HStack justifyContent="space-between" alignItems="center" mb={2}>
                    <VStack>
                      <Text fontSize="md" fontWeight="medium" color="coolGray.700">
                        {item.nama_barang || "Unnamed Item"}
                      </Text>
                      <HStack space={1} alignItems="center">
                        <Text fontSize="xs" color="coolGray.500">
                          Kode: {item.kode_barang || "N/A"}
                        </Text>
                        <Text fontSize="xs" color="coolGray.500">
                          • {item.kategori_barang || "Tidak ada kategori"}
                        </Text>
                      </HStack>
                    </VStack>
                    {getItemStatus(item)}
                  </HStack>
                  
                  <HStack justifyContent="space-between" alignItems="center" mt={1}>
                    <HStack space={2} alignItems="center">
                      <Icon as={MaterialCommunityIcons} name="package-variant" size="xs" color="coolGray.500" />
                      <Text fontSize="sm" color="coolGray.600">
                        {item.jumlah_barang || 0} unit
                      </Text>
                    </HStack>
                    
                    {barangKeluar.status === 'Accepted' && item.status !== 'dikembalikan' && (
                      <Button
                        size="xs"
                        colorScheme="orange"
                        leftIcon={<Icon as={FontAwesome5} name="undo" size="xs" />}
                        onPress={() => handleReturnItem(item.id)}
                        isLoading={processingAction}
                        isDisabled={processingAction}
                      >
                        Retur
                      </Button>
                    )}
                  </HStack>
                </Box>
              ))}
            </VStack>
          ) : (
            <Center p={4}>
              <Text color="coolGray.500">Tidak ada barang</Text>
            </Center>
          )}
        </Box>
        
        {/* Contact Section */}
        {barangKeluar.userId && (
          <Box bg="white" p={4} rounded="xl" shadow={2} mb={4}>
            <Text fontSize="md" fontWeight="bold" color="coolGray.700" mb={3}>
              Informasi Kontak
            </Text>
            
            <HStack space={3} alignItems="center">
              <Center
                w={12}
                h={12}
                bg="blue.100"
                rounded="full"
              >
                <Icon 
                  as={MaterialIcons} 
                  name="person" 
                  size="md" 
                  color="blue.500" 
                />
              </Center>
              <VStack>
                <Text fontSize="md" color="coolGray.700" fontWeight="medium">
                  {barangKeluar.Nama_PihakPeminjam || "Tidak ada nama"}
                </Text>
                <Text fontSize="sm" color="coolGray.500">
                  ID: {barangKeluar.userId.slice(0, 10)}...
                </Text>
              </VStack>
            </HStack>
          </Box>
        )}
      </ScrollView>
    </Box>
  );
};

export default StafBarangDetail;