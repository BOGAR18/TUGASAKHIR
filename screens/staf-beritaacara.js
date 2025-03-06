import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  ScrollView,
  useToast
} from 'native-base';
import moment from 'moment';
import {
  getDatabase,
  ref,
  get,
  update,
  push,
  set
} from 'firebase/database';
import { captureRef } from 'react-native-view-shot';
import RNPrint from 'react-native-print';
import RNFetchBlob from 'rn-fetch-blob';
import storage from '@react-native-firebase/storage';
import { Platform } from 'react-native';

const BeritaAcara = ({ route, navigation }) => {
  const { id } = route.params;
  const [beritaAcaraData, setBeritaAcaraData] = useState(null);
  const [barangKeluarData, setBarangKeluarData] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [beritaAcaraNumber, setBeritaAcaraNumber] = useState('');
  const toast = useToast();
  const printViewRef = useRef(null);

  // Safely get document directory
  const getDocumentDirectory = () => {
    try {
      if (Platform.OS === 'ios') {
        return RNFetchBlob.fs.dirs.DocumentDir;
      } else if (Platform.OS === 'android') {
        return RNFetchBlob.fs.dirs.DownloadDir;
      }
      return RNFetchBlob.fs.dirs.CacheDir; // Fallback
    } catch (error) {
      console.error('Error getting document directory:', error);
      return null;
    }
  };

  // Fetch Berita Acara and Barang Keluar data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const database = getDatabase();
        
        // Fetch Barang Keluar data first
        const barangKeluarRef = ref(database, `Barang_Keluar/${id}`);
        const barangKeluarSnapshot = await get(barangKeluarRef);
        const barangKeluarVal = barangKeluarSnapshot.val();
        setBarangKeluarData(barangKeluarVal);

        // Determine Berita Acara generation type based on Kategori_Peminjaman
        const kategori = barangKeluarVal?.Kategori_Peminjaman || 'Reguler';
        
        // Generate or fetch existing Berita Acara
        if (kategori === 'Insidentil') {
          await generateBeritaAcaraInsidentil(barangKeluarVal);
        } else {
          await generateBeritaAcaraReguler(barangKeluarVal);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.show({
          title: "Error",
          description: "Gagal memuat data Barang Keluar",
          status: "error"
        });
      }
    };

    fetchData();
  }, [id, toast]);

  // Generate Berita Acara for Reguler
  const generateBeritaAcaraReguler = async (barangKeluarData) => {
    try {
      const database = getDatabase();
      
      // Get the next sequential number
      const beritaAcaraRef = ref(database, 'Berita_Acara');
      const snapshot = await get(beritaAcaraRef);
      const existingCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
      const nextNumber = String(existingCount + 1).padStart(3, '0');

      // Current date
      const currentDate = moment();

      // Generate Berita Acara Number
      const beritaAcaraNumberParts = [
        nextNumber,
        'STI-JATIM',
        'REG',
        currentDate.format('YYYY'),
        currentDate.format('MM')
      ];
      const generatedNumber = beritaAcaraNumberParts.join('/');
      setBeritaAcaraNumber(generatedNumber);

      // Prepare Berita Acara Data
      const beritaAcaraData = {
        No_SuratJalanBK: generatedNumber,
        Nama_PihakPeminjam: barangKeluarData.Nama_PihakPeminjam,
        tanggal_peminjamanbarang: barangKeluarData.tanggal_peminjamanbarang,
        Tanggal_PengembalianBarang: barangKeluarData.Tanggal_PengembalianBarang,
        barang_keluar_id: id,
        barang: barangKeluarData.barang,
        status: 'Accepted',
        dibuat_oleh: 'Staf',
        dibuat_pada: currentDate.format('YYYY-MM-DD HH:mm:ss'),
        Catatan: '' // You can add a note field if needed
      };

      // Create new Berita Acara entry
      const newBeritaAcaraRef = push(beritaAcaraRef);
      await set(newBeritaAcaraRef, beritaAcaraData);

      // Update Barang Keluar with Berita Acara info
      const barangKeluarUpdateRef = ref(database, `Barang_Keluar/${id}`);
      await update(barangKeluarUpdateRef, {
        berita_acara_id: newBeritaAcaraRef.key,
        status: 'Accepted'
      });

      setBeritaAcaraData(beritaAcaraData);
    } catch (error) {
      console.error('Error generating Berita Acara Reguler:', error);
      toast.show({
        title: "Error",
        description: "Gagal membuat Berita Acara",
        status: "error"
      });
    }
  };

  // Generate Berita Acara for Insidentil
  const generateBeritaAcaraInsidentil = async (barangKeluarData) => {
    try {
      const database = getDatabase();
      
      // Get the next sequential number
      const beritaAcaraRef = ref(database, 'Berita_Acara');
      const snapshot = await get(beritaAcaraRef);
      const existingCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
      const nextNumber = String(existingCount + 1).padStart(3, '0');

      // Current date
      const currentDate = moment();

      // Generate Berita Acara Number
      const beritaAcaraNumberParts = [
        nextNumber,
        'STI-JATIM',
        'INS',
        currentDate.format('YYYY'),
        currentDate.format('MM')
      ];
      const generatedNumber = beritaAcaraNumberParts.join('/');
      setBeritaAcaraNumber(generatedNumber);

      // Prepare Berita Acara Data
      const beritaAcaraData = {
        No_SuratJalanBK: generatedNumber,
        Nama_PihakPeminjam: barangKeluarData.Nama_PihakPeminjam,
        tanggal_peminjamanbarang: barangKeluarData.tanggal_peminjamanbarang,
        Tanggal_PengembalianBarang: barangKeluarData.Tanggal_PengembalianBarang,
        barang_keluar_id: id,
        barang: barangKeluarData.barang,
        status: 'Accepted',
        dibuat_oleh: 'Staf',
        dibuat_pada: currentDate.format('YYYY-MM-DD HH:mm:ss'),
        Catatan: '' // You can add a note field if needed
      };

      // Create new Berita Acara entry
      const newBeritaAcaraRef = push(beritaAcaraRef);
      await set(newBeritaAcaraRef, beritaAcaraData);

      // Update Barang Keluar with Berita Acara info
      const barangKeluarUpdateRef = ref(database, `Barang_Keluar/${id}`);
      await update(barangKeluarUpdateRef, {
        berita_acara_id: newBeritaAcaraRef.key,
        status: 'Accepted'
      });

      setBeritaAcaraData(beritaAcaraData);
    } catch (error) {
      console.error('Error generating Berita Acara Insidentil:', error);
      toast.show({
        title: "Error",
        description: "Gagal membuat Berita Acara",
        status: "error"
      });
    }
  };

  // Generate PDF and upload to Firebase Storage
  const generateAndUploadPDF = async () => {
    setIsPrinting(true);
    try {
      // Get safe document directory
      const documentDir = getDocumentDirectory();
      if (!documentDir) {
        throw new Error('Tidak dapat mengakses direktori dokumen');
      }

      // Capture view as an image first
      const uri = await captureRef(printViewRef, {
        format: 'png',
        quality: 1,
      });

      // Generate a unique filename
      const filename = `berita_acara_${id}_${Date.now()}.pdf`;
      const destinationPath = `${documentDir}/${filename}`;

      // Print PDF with a specific destination
      const printResult = await RNPrint.print({
        filePath: uri,
        // Specify the output path for the PDF on some platforms
        ...(Platform.OS === 'ios' || Platform.OS === 'android' 
          ? { 
              printerURL: `file://${destinationPath}`,
              jobName: filename 
            } 
          : {}
        )
      });

      // Upload to Firebase Storage
      const reference = storage().ref(`berita_acara/${filename}`);
      await reference.putFile(uri);

      // Get download URL
      const downloadURL = await reference.getDownloadURL();

      // Update Berita Acara record with PDF URL
      const database = getDatabase();
      const beritaAcaraRef = ref(database, `Berita_Acara/${id}`);
      await update(beritaAcaraRef, {
        File_BeritaAcara: downloadURL
      });

      // Update associated Barang Keluar record
      const barangKeluarRef = ref(database, `Barang_Keluar/${id}`);
      await update(barangKeluarRef, {
        File_BeritaAcara: downloadURL
      });

      toast.show({
        title: "Berhasil",
        description: "PDF Berita Acara telah dibuat dan disimpan",
        status: "success"
      });
    } catch (error) {
      console.error('Error generating/uploading PDF:', error);
      toast.show({
        title: "Error",
        description: `Gagal membuat PDF: ${error.message}`,
        status: "error"
      });
    } finally {
      setIsPrinting(false);
    }
  };

  // Render barang items
  const renderBarangItems = () => {
    if (!barangKeluarData || !barangKeluarData.barang) return null;

    // Ensure barang is an array
    const barangItems = Array.isArray(barangKeluarData.barang) 
      ? barangKeluarData.barang 
      : Object.values(barangKeluarData.barang);

    return barangItems.map((item, index) => (
      <HStack key={index} justifyContent="space-between" borderBottomWidth={1} borderColor="coolGray.200" py={2}>
        <Text flex={1}>{item.nama_barang || 'Nama Barang'}</Text>
        <Text flex={1} textAlign="center">{item.kode_barang || 'Kode Barang'}</Text>
        <Text flex={1} textAlign="right">{item.jumlah || '0'} Unit</Text>
      </HStack>
    ));
  };

  // Render component
  const renderContent = () => {
    if (!barangKeluarData) {
      return (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Text>Memuat data...</Text>
        </Box>
      );
    }

    return (
      <ScrollView ref={printViewRef}>
        <Box p={4}>
          {/* Header */}
          <VStack space={4} mb={6}>
            <Heading textAlign="center" size="xl">BERITA ACARA</Heading>
            <Text textAlign="center" fontSize="md">
              Nomor: {beritaAcaraNumber}
            </Text>
          </VStack>

          {/* Borrower Details */}
          <VStack space={3} mb={6}>
            <HStack justifyContent="space-between">
              <Text fontWeight="bold">Nama Peminjam</Text>
              <Text>{barangKeluarData.Nama_PihakPeminjam || 'Tidak ada nama'}</Text>
            </HStack>
            <HStack justifyContent="space-between">
              <Text fontWeight="bold">Tanggal Peminjaman</Text>
              <Text>{moment(barangKeluarData.tanggal_peminjamanbarang).format('DD MMMM YYYY')}</Text>
            </HStack>
            <HStack justifyContent="space-between">
              <Text fontWeight="bold">Tanggal Pengembalian</Text>
              <Text>{moment(barangKeluarData.Tanggal_PengembalianBarang).format('DD MMMM YYYY')}</Text>
            </HStack>
          </VStack>

          {/* Barang Details */}
          <VStack space={3} mb={6}>
            <Heading size="md" mb={2}>Daftar Barang</Heading>
            <HStack justifyContent="space-between" borderBottomWidth={2} borderColor="coolGray.300" pb={2}>
              <Text flex={1} fontWeight="bold">Nama Barang</Text>
              <Text flex={1} textAlign="center" fontWeight="bold">Kode Barang</Text>
              <Text flex={1} textAlign="right" fontWeight="bold">Jumlah</Text>
            </HStack>
            {renderBarangItems()}
          </VStack>

          {/* Notes */}
          <VStack space={3}>
            <Heading size="md" mb={2}>Catatan</Heading>
            <Text>{barangKeluarData.Catatan || 'Tidak ada catatan'}</Text>
          </VStack>
        </Box>
      </ScrollView>
    );
  };

  return (
    <Box flex={1} bg="white">
      {renderContent()}
      
      {/* Print/Share Buttons */}
      <HStack p={4} space={4}>
        <Button 
          flex={1} 
          colorScheme="blue"
          onPress={generateAndUploadPDF}
          isLoading={isPrinting}
          isLoadingText="Mencetak..."
        >
          Cetak
        </Button>
        <Button 
          flex={1} 
          colorScheme="green"
          onPress={() => {
            // Implement share functionality
            toast.show({
              title: "Bagikan BA",
              description: "Fitur bagikan akan segera tersedia",
              status: "info"
            });
          }}
          isDisabled={isPrinting}
        >
          Bagikan
        </Button>
      </HStack>
    </Box>
  );
};

export default BeritaAcara;