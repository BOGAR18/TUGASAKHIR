import React, { useState, useEffect } from "react";
import { ScrollView, Linking, RefreshControl } from 'react-native';
import { 
  Box, 
  Button, 
  Text, 
  VStack, 
  HStack, 
  Center, 
  Divider, 
  Icon, 
  Badge, 
  Pressable,
  useToast,
  Skeleton,
} from 'native-base';
import { getDatabase, ref, onValue } from "firebase/database";
import Header from "../components/header";
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import FIREBASE from "../actions/config/FIREBASE";
import { getData } from "../utils";

const Barang = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [barangData, setBarangData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getUserData();
  }, []);

  useEffect(() => {
    if (!user) return;

    const database = getDatabase();
    const BarangKeluarRef = ref(database, "Barang_Keluar");

    const unsubscribe = onValue(BarangKeluarRef, (snapshot) => {
      const BarangKeluarData = snapshot.val();
      if (BarangKeluarData) {
        const BarangArray = Object.entries(BarangKeluarData)
          .map(([key, value]) => ({
            id: key,
            ...value,
          }))
          .filter(item => item.userId === user.uid)
          .map(item => ({
            ...item,
            File_BeritaAcara: item.status === 'Accepted' ? (item.File_BeritaAcara || 'URL_TO_PDF') : null,
            Catatan: item.status === 'Accepted' ? (item.Catatan || 'Catatan terkait barang ini') : null
          }))
          .sort((a, b) => new Date(b.tanggal_peminjamanbarang) - new Date(a.tanggal_peminjamanbarang));

        setBarangData(BarangArray);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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
      toast.show({
        title: "Error",
        description: "Gagal memuat data pengguna",
        status: "error"
      });
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    getUserData().finally(() => setRefreshing(false));
  }, []);

  const toggleExpand = (id) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleViewPDF = (url) => {
    Linking.openURL(url).catch((err) => {
      toast.show({
        title: "Error",
        description: "Gagal membuka file PDF",
        status: "error"
      });
    });
  };

  const StatusBadge = ({ status }) => (
    <Badge
      colorScheme={status === 'Accepted' ? "success" : "yellow"}
      variant="subtle"
      rounded="full"
      px={3}
      py={1}
      _text={{
        fontSize: "xs",
        fontWeight: "bold",
      }}
    >
      {status === 'Accepted' ? 'Diterima' : 'Pending'}
    </Badge>
  );

  const BarangCard = ({ item }) => (
    <Pressable onPress={() => toggleExpand(item.id)}>
      <Box
        bg="white"
        rounded="2xl"
        shadow="md"
        mb={4}
        borderWidth={1}
        borderColor="gray.400"
        overflow="hidden"
        _pressed={{ bg: "gray.50" }}
      >
        <Box p={4}>
          <HStack justifyContent="space-between" alignItems="center" mb={3}>
            <VStack space={1}>
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                {item.Kategori_Peminjaman}
              </Text>
              <Text fontSize="sm" color="gray.600">
                {item.Nama_PihakPeminjam}
              </Text>
            </VStack>
            <StatusBadge status={item.status} />
          </HStack>

          <HStack space={6} mb={expanded[item.id] ? 4 : 0}>
            <HStack space={2} alignItems="center">
              <Icon as={MaterialIcons} name="event" size="sm" color="gray.500" />
              <Text fontSize="sm" color="gray.600">
                {item.tanggal_peminjamanbarang || "Tidak Ada"}
              </Text>
            </HStack>
            <HStack space={2} alignItems="center">
              <Icon as={MaterialIcons} name="inventory" size="sm" color="gray.500" />
              <Text fontSize="sm" color="gray.600">
                {item.barang ? `${item.barang.length} Barang` : "0 Barang"}
              </Text>
            </HStack>
          </HStack>

          {expanded[item.id] && (
            <VStack space={4} mt={4}>
              <Divider />
              
              {item.status === 'Accepted' && (
                <VStack space={4}>
                  <Text fontSize="md" fontWeight="semibold" color="gray.700">
                    File Berita Acara
                  </Text>
                  {item.File_BeritaAcara ? (
                    <Button
                      size="sm"
                      colorScheme="blue"
                      leftIcon={<Icon as={MaterialIcons} name="picture-as-pdf" size="sm" />}
                      onPress={() => handleViewPDF(item.File_BeritaAcara)}
                    >
                      Lihat File
                    </Button>
                  ) : (
                    <Text fontSize="sm" color="gray.500">
                      Tidak ada File Berita Acara
                    </Text>
                  )}
                  
                  <Box bg="gray.50" p={3} rounded="lg">
                    <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={1}>
                      Catatan
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {item.Catatan || "Tidak ada catatan"}
                    </Text>
                  </Box>
                </VStack>
              )}

              <VStack space={3}>
                <Text fontSize="md" fontWeight="semibold" color="gray.700">
                  Daftar Barang
                </Text>
                {item.barang ? (
                  item.barang.map((barang, index) => (
                    <Box
                      key={index}
                      bg="gray.50"
                      p={4}
                      rounded="lg"
                      borderWidth={1}
                      borderColor="gray.200"
                    >
                      <VStack space={3}>
                        <HStack justifyContent="space-between" alignItems="center">
                          <Text fontSize="md" fontWeight="semibold" color="gray.800">
                            {barang.nama_barang}
                          </Text>
                          <Badge colorScheme="blue" variant="subtle">
                            {barang.kode_barang}
                          </Badge>
                        </HStack>
                        
                        <HStack space={4}>
                          <VStack>
                            <Text fontSize="xs" color="gray.500">Jumlah</Text>
                            <Text fontSize="sm" color="gray.700">{barang.jumlah_barang}</Text>
                          </VStack>
                          <VStack>
                            <Text fontSize="xs" color="gray.500">Kategori</Text>
                            <Text fontSize="sm" color="gray.700">{barang.kategori_barang}</Text>
                          </VStack>
                        </HStack>

                        {item.status === 'Accepted' && (
                          <Button
                            size="sm"
                            colorScheme="orange"
                            leftIcon={<Icon as={FontAwesome5} name="undo" size="xs" />}
                            onPress={() =>
                              navigation.navigate('CreateRetur', {
                                Pihak_Pemohon: item.Nama_PihakPeminjam,
                                kode_barang: barang.kode_barang,
                                kategori_barang: barang.kategori_barang,
                                nama_barang: barang.nama_barang,
                                garansi_barang_awal: barang.garansi_barang_awal,
                                garansi_barang_akhir: barang.garansi_barang_akhir,
                                jumlah_barang: barang.jumlah_barang,
                              })
                            }
                          >
                            Retur Barang
                          </Button>
                        )}
                      </VStack>
                    </Box>
                  ))
                ) : (
                  <Text fontSize="sm" color="gray.500">
                    Tidak ada barang
                  </Text>
                )}
              </VStack>
            </VStack>
          )}
        </Box>
      </Box>
    </Pressable>
  );

  const LoadingSkeleton = () => (
    <VStack space={4} p={4}>
      {[1, 2, 3].map((item) => (
        <Box key={item} bg="white" rounded="xl" overflow="hidden" p={4}>
          <Skeleton.Text px={4} />
          <Skeleton h={6} rounded="full" mt={4} />
          <Skeleton.Text px={4} mt={4} />
        </Box>
      ))}
    </VStack>
  );

  return (
    <>
      <Header title="UID Jawa Timur" />
      <Box flex={1} bg="gray.100">
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
           <Box
              bg="blue.600"
              padding={2}
            >
              <HStack justifyContent="space-between" alignItems="center">
                <VStack space={1}>
                  <Text fontSize="xl" color="white" fontWeight="bold">
                    Data Barang
                  </Text>
                  <Text fontSize="xs" color="white" opacity={0.9}>
                    Sistem Manajemen Inventaris
                  </Text>
                </VStack>
                <Button
                  onPress={() => navigation.navigate('CreateBarang')}
                  bg="white"
                  _pressed={{ bg: "gray.100" }}
                  rounded="full"
                  leftIcon={
                    <Icon as={MaterialIcons} name="add" size="sm" color="blue.600" />
                  }
                >
                  <Text>
                  Ajukan Barang
                  </Text>
                </Button>
              </HStack>
            </Box>
          <Box p={4}>

            {/* Content Section */}
            {loading ? (
              <LoadingSkeleton />
            ) : barangData.length > 0 ? (
              barangData.map(item => (
                <BarangCard key={item.id} item={item} />
              ))
            ) : (
              <Center py={12}>
                <Icon as={MaterialIcons} name="inventory" size="4xl" color="gray.300" />
                <Text fontSize="lg" color="gray.500" mt={4}>
                  Tidak ada data barang
                </Text>
              </Center>
            )}
          </Box>
        </ScrollView>
      </Box>
    </>
  );
};

export default Barang;