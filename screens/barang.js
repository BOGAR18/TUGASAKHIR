import React, { useState, useEffect, useMemo } from "react";
import { ScrollView, Linking, RefreshControl } from "react-native";
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
  Input,
  Actionsheet,
  useDisclose,
} from "native-base";
import { getDatabase, ref, onValue } from "firebase/database";
import Header from "../components/header";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import FIREBASE from "../actions/config/FIREBASE";
import { getData } from "../utils";

const Barang = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [barangData, setBarangData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclose();

  // Filtered and searched data
  const filteredBarangData = useMemo(() => {
    return barangData.filter((item) => {
      // Search filter
      const matchesSearch =
        item.Nama_PihakPeminjam.toLowerCase().includes(
          searchQuery.toLowerCase()
        ) ||
        (item.barang &&
          item.barang.some(
            (b) =>
              b.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
              b.kode_barang.toLowerCase().includes(searchQuery.toLowerCase())
          ));

      // Status filter
      const matchesStatus =
        filterStatus === "All" ||
        item.status === filterStatus ||
        (filterStatus === "Dikembalikan" &&
          item.status === "Dikembalikan" &&
          item.Kategori_Peminjaman === "Insidentil");

      // Category filter
      const matchesCategory =
        filterCategory === "All" || item.Kategori_Peminjaman === filterCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [barangData, searchQuery, filterStatus, filterCategory]);

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
          .filter((item) => item.userId === user.uid)
          .map((item) => ({
            ...item,
            File_BeritaAcara:
              item.status === "Accepted"
                ? item.File_BeritaAcara || "URL_TO_PDF"
                : null,
            Catatan:
              item.status === "Accepted"
                ? item.Catatan || "Catatan terkait barang ini"
                : null,
          }))
          .sort(
            (a, b) =>
              new Date(b.tanggal_peminjamanbarang) -
              new Date(a.tanggal_peminjamanbarang)
          );

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
        status: "error",
      });
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    getUserData().finally(() => setRefreshing(false));
  }, []);

  const handleViewPDF = (url) => {
    Linking.openURL(url).catch((err) => {
      toast.show({
        title: "Error",
        description: "Gagal membuka file PDF",
        status: "error",
      });
    });
  };

  const StatusBadge = ({ item }) => {
    if (item.status === "Accepted") {
      return (
        <Badge
          colorScheme="success"
          variant="subtle"
          rounded="full"
          px={3}
          py={1}
          _text={{
            fontSize: "xs",
            fontWeight: "bold",
          }}
        >
          Accepted
        </Badge>
      );
    } else if (
      item.status === "Dikembalikan" &&
      item.Kategori_Peminjaman === "Insidentil"
    ) {
      return (
        <Badge
          colorScheme="info"
          variant="subtle"
          rounded="full"
          px={3}
          py={1}
          _text={{
            fontSize: "xs",
            fontWeight: "bold",
          }}
        >
          Dikembalikan
        </Badge>
      );
    } else {
      return (
        <Badge
          colorScheme="yellow"
          variant="subtle"
          rounded="full"
          px={3}
          py={1}
          _text={{
            fontSize: "xs",
            fontWeight: "bold",
          }}
        >
          Pending
        </Badge>
      );
    }
  };

  const BarangCard = ({ item }) => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
      setExpanded(!expanded);
    };

    return (
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
            <VStack space={1} flex={1}>
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                {item.Kategori_Peminjaman}
              </Text>
              <Text fontSize="sm" color="gray.600">
                {item.Nama_PihakPeminjam}
              </Text>
            </VStack>

            <HStack alignItems="center" space={2}>
              <StatusBadge item={item} />

              <Pressable
                onPress={toggleExpand}
                p={2}
                rounded="full"
                _pressed={{ bg: "gray.100" }}
              >
                <Icon
                  as={MaterialIcons}
                  name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                  size="md"
                  color="gray.500"
                />
              </Pressable>
            </HStack>
          </HStack>

          <HStack space={6} mb={expanded ? 4 : 0}>
            <HStack space={2} alignItems="center">
              <Icon
                as={MaterialIcons}
                name="event"
                size="sm"
                color="gray.500"
              />
              <Text fontSize="sm" color="gray.600">
                {item.tanggal_peminjamanbarang || "Tidak Ada"}
              </Text>
            </HStack>
            <HStack space={2} alignItems="center">
              <Icon
                as={MaterialIcons}
                name="inventory"
                size="sm"
                color="gray.500"
              />
              <Text fontSize="sm" color="gray.600">
                {item.barang ? `${item.barang.length} Barang` : "0 Barang"}
              </Text>
            </HStack>
          </HStack>

          {expanded && (
            <VStack space={4} mt={4}>
              <Divider />

              {item.status === "Accepted" && (
                <VStack space={4}>
                  <Text fontSize="md" fontWeight="semibold" color="gray.700">
                    File Berita Acara
                  </Text>
                  {item.File_BeritaAcara ? (
                    <Button
                      size="sm"
                      colorScheme="blue"
                      leftIcon={
                        <Icon
                          as={MaterialIcons}
                          name="picture-as-pdf"
                          size="sm"
                        />
                      }
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
                    <Text
                      fontSize="md"
                      fontWeight="semibold"
                      color="gray.700"
                      mb={1}
                    >
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
                        <HStack
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Text
                            fontSize="md"
                            fontWeight="semibold"
                            color="gray.800"
                          >
                            {barang.nama_barang}
                          </Text>
                          <Badge colorScheme="blue" variant="subtle">
                            {barang.kode_barang}
                          </Badge>
                        </HStack>

                        <HStack space={4}>
                          <VStack>
                            <Text fontSize="xs" color="gray.500">
                              Jumlah
                            </Text>
                            <Text fontSize="sm" color="gray.700">
                              {barang.jumlah_barang}
                            </Text>
                          </VStack>
                          <VStack>
                            <Text fontSize="xs" color="gray.500">
                              Kategori
                            </Text>
                            <Text fontSize="sm" color="gray.700">
                              {barang.kategori_barang}
                            </Text>
                          </VStack>
                        </HStack>

                        {item.status === "Accepted" && (
                          <Button
                            size="sm"
                            colorScheme="orange"
                            leftIcon={
                              <Icon as={FontAwesome5} name="undo" size="xs" />
                            }
                            onPress={() =>
                              navigation.navigate("CreateRetur", {
                                Pihak_Pemohon: item.Nama_PihakPeminjam,
                                kode_barang: barang.kode_barang,
                                kategori_barang: barang.kategori_barang,
                                nama_barang: barang.nama_barang,
                                garansi_barang_awal: barang.garansi_barang_awal,
                                garansi_barang_akhir:
                                  barang.garansi_barang_akhir,
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
    );
  };

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
          <Box bg="blue.600" padding={2}>
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
                onPress={() => navigation.navigate("CreateBarang")}
                bg="white"
                _pressed={{ bg: "gray.100" }}
                rounded="full"
                leftIcon={
                  <Icon
                    as={MaterialIcons}
                    name="add"
                    size="sm"
                    color="blue.600"
                  />
                }
              >
                <Text>Ajukan Barang</Text>
              </Button>
            </HStack>
          </Box>

          <Box bg={"white"} padding={1}>
          {/* Search and Filter Section */}
          <HStack p={2} space={2}>
            <Input
              flex={1}
              placeholder="Cari Barang..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              InputLeftElement={
                <Icon
                  as={MaterialIcons}
                  name="search"
                  size="md"
                  ml={2}
                  color="gray.400"
                />
              }
            />
            <Button
              onPress={onOpen}
              variant="outline"
              leftIcon={<Icon as={MaterialIcons} name="filter-list" />}
            >
              Filter
            </Button>
          </HStack>

          {/* Filter Actionsheet */}
          <Actionsheet isOpen={isOpen} onClose={onClose}>
            <Actionsheet.Content>
              <Box w="100%" h={60} px={4} justifyContent="center">
                <Text fontSize="16" color="gray.500" fontWeight="bold">
                  Filter Barang
                </Text>
              </Box>

              {/* Status Filter */}
              <Actionsheet.Item
                onPress={() => {
                  setFilterStatus("All");
                  onClose();
                }}
                startIcon={
                  <Icon
                    as={MaterialIcons}
                    name="clear"
                    color={filterStatus === "All" ? "blue.500" : "gray.500"}
                  />
                }
              >
                Semua Status
              </Actionsheet.Item>
              <Actionsheet.Item
                onPress={() => {
                  setFilterStatus("Pending");
                  onClose();
                }}
                startIcon={
                  <Icon
                    as={MaterialIcons}
                    name="pending"
                    color={filterStatus === "Pending" ? "blue.500" : "gray.500"}
                  />
                }
              >
                Pending
              </Actionsheet.Item>
              <Actionsheet.Item
                onPress={() => {
                  setFilterStatus("Dikembalikan");
                  onClose();
                }}
                startIcon={
                  <Icon
                    as={MaterialIcons}
                    name="check-circle"
                    color={
                      filterStatus === "Dikembalikan" ? "blue.500" : "gray.500"
                    }
                  />
                }
              >
                Dikembalikan
              </Actionsheet.Item>
              <Actionsheet.Item
                onPress={() => {
                  setFilterStatus("Accepted");
                  onClose();
                }}
                startIcon={
                  <Icon
                    as={MaterialIcons}
                    name="check-circle-outline"
                    color={
                      filterStatus === "Accepted" ? "blue.500" : "gray.500"
                    }
                  />
                }
              >
                Accepted
              </Actionsheet.Item>

              {/* Category Filter */}
              {/* <Box w="100%" h={60} px={4} justifyContent="center">
                <Text fontSize="16" color="gray.500" fontWeight="bold">
                  Kategori Peminjaman
                </Text>
              </Box>
              <Actionsheet.Item
                onPress={() => {
                  setFilterCategory("All");
                  onClose();
                }}
                startIcon={
                  <Icon
                    as={MaterialIcons}
                    name="clear"
                    color={filterCategory === "All" ? "blue.500" : "gray.500"}
                  />
                }
              >
                Semua Kategori
              </Actionsheet.Item>
              <Actionsheet.Item
                onPress={() => {
                  setFilterCategory("Insidentil");
                  onClose();
                }}
                startIcon={
                  <Icon
                    as={MaterialIcons}
                    name="category"
                    color={
                      filterCategory === "Insidentil" ? "blue.500" : "gray.500"
                    }
                  />
                }
              >
                Insidentil
              </Actionsheet.Item> */}
            </Actionsheet.Content>
          </Actionsheet>
          </Box>

          <Box p={4}>
            {/* Content Section */}
            {loading ? (
              <LoadingSkeleton />
            ) : filteredBarangData.length > 0 ? (
              filteredBarangData.map((item) => (
                <BarangCard key={item.id} item={item} />
              ))
            ) : (
              <Center py={12}>
                <Icon
                  as={MaterialIcons}
                  name="inventory"
                  size="4xl"
                  color="gray.300"
                />
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
