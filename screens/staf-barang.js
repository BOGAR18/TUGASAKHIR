import React, { useState, useEffect } from "react";
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
  StatusBar,
  Input,
  IconButton,
  Center,
  useColorModeValue,
  useToast,
  FlatList,
  Modal,
  Divider,
  Alert,
} from "native-base";
import {
  MaterialIcons,
  Ionicons,
  FontAwesome5,
  AntDesign,
  Feather,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import moment from "moment";
import "moment/locale/id";
import { getDatabase, ref, onValue, update } from "firebase/database";
import { RefreshControl, Linking } from "react-native";
import { getAuth } from "firebase/auth";
import Header from "../components/header";

// Filter Button Component
const FilterButton = ({ label, statusValue, iconName, isActive, onPress }) => {
  return (
    <Pressable
      onPress={() => onPress(statusValue)}
      bg={isActive ? "blue.600" : "white"}
      px={4}
      py={2}
      rounded="full"
      shadow={isActive ? 3 : 1}
    >
      <HStack space={2} alignItems="center">
        <Icon
          as={MaterialCommunityIcons}
          name={iconName}
          color={isActive ? "white" : "gray.500"}
          size="sm"
        />
        <Text
          color={isActive ? "white" : "gray.700"}
          fontWeight={isActive ? "medium" : "normal"}
          fontSize="sm"
        >
          {label}
        </Text>
      </HStack>
    </Pressable>
  );
};

const StafBarang = ({ navigation }) => {
  const [barangKeluarList, setBarangKeluarList] = useState([]);
  const [filteredBarangKeluarList, setFilteredBarangKeluarList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  // Color and styling
  const primaryColor = "#4361ee";
  const accentColor = "#3f37c9";
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subtextColor = useColorModeValue("gray.600", "gray.400");

  // Set moment locale to Indonesian
  moment.locale("id");

  // No need to fetch user role since roles are handled separately in different components

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Tidak ada tanggal";
    return moment(dateString).format("DD MMMM YYYY");
  };

  // Fetch Barang Keluar data from Firebase
  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const database = getDatabase();
      const barangKeluarRef = ref(database, "Barang_Keluar");

      onValue(
        barangKeluarRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            // Convert Firebase object to array and process data
            const processedData = Object.keys(data).map((key) => {
              // Ensure barang is an array
              let items = [];
              if (data[key].barang) {
                if (Array.isArray(data[key].barang)) {
                  items = data[key].barang;
                } else {
                  // If barang is an object, convert to array
                  items = Object.values(data[key].barang);
                }
              }

              return {
                id: key,
                ...data[key],
                items: items,
                // Calculate total number of items
                total_barang: items.length,
              };
            });

            setBarangKeluarList(processedData);
            applyFilters(processedData, searchQuery, filterStatus);
          } else {
            setBarangKeluarList([]);
            setFilteredBarangKeluarList([]);
          }
          setIsRefreshing(false);
        },
        (error) => {
          console.error("Error fetching Barang Keluar:", error);
          toast.show({
            title: "Error",
            description: "Gagal memuat data barang keluar",
            status: "error",
          });
          setIsRefreshing(false);
        }
      );
    } catch (error) {
      console.error("Fetch data error:", error);
      toast.show({
        title: "Error",
        description: "Terjadi kesalahan saat memuat data",
        status: "error",
      });
      setIsRefreshing(false);
    }
  };

  // Apply filters based on search query and status
  const applyFilters = (data, query, status) => {
    let filtered = [...data];

    // Filter by search query
    if (query.trim()) {
      const searchLower = query.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.Nama_PihakPeminjam &&
            item.Nama_PihakPeminjam.toLowerCase().includes(searchLower)) ||
          (item.No_SuratJalanBK &&
            item.No_SuratJalanBK.toLowerCase().includes(searchLower)) ||
          (item.items &&
            item.items.some(
              (barang) =>
                (barang.nama_barang &&
                  barang.nama_barang.toLowerCase().includes(searchLower)) ||
                (barang.kode_barang &&
                  barang.kode_barang.toLowerCase().includes(searchLower))
            ))
      );
    }

    if (status !== "all") {
      const now = moment();

      if (status === "active") {
        filtered = filtered.filter(
          (item) =>
            item.status === "Accepted" &&
            (!item.Tanggal_PengembalianBarang ||
              moment(item.Tanggal_PengembalianBarang).isAfter(now))
        );
      } else if (status === "pending") {
        filtered = filtered.filter((item) => item.status === "Pending");
      } else if (status === "expired") {
        filtered = filtered.filter(
          (item) =>
            item.status === "Accepted" &&
            item.Tanggal_PengembalianBarang &&
            moment(item.Tanggal_PengembalianBarang).isBefore(now)
        );
      } else if (status === "Dikembalikan") {
        // New filter for "Dikembalikan" status
        filtered = filtered.filter((item) => item.status === "Dikembalikan");
      } else if (status === "active-insidentil") {
        // New filter for active insidentil items
        filtered = filtered.filter(
          (item) =>
            item.status === "Accepted" &&
            item.Kategori_Peminjaman?.toLowerCase() === "insidentil" &&
            item.Tanggal_PengembalianBarang &&
            moment(item.Tanggal_PengembalianBarang).isAfter(now)
        );
      }
    }

    setFilteredBarangKeluarList(filtered);
  };

  // Watch for changes to search query and filter status
  useEffect(() => {
    applyFilters(barangKeluarList, searchQuery, filterStatus);
  }, [searchQuery, filterStatus, barangKeluarList]);

  // Calculate time remaining
  const getRemainingTime = (startDate, returnDate) => {
    if (!startDate || !returnDate) return null;

    const end = moment(returnDate);
    const start = moment();

    if (start.isAfter(end)) return "Expired";

    const duration = moment.duration(end.diff(start));
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();

    return `${days}d ${hours}h ${minutes}m`;
  };

  // Get status badge component
  const getStatusBadge = (item) => {
    if (item.status === "Accepted") {
      if (item.Tanggal_PengembalianBarang) {
        const remainingTime = getRemainingTime(
          item.tanggal_peminjamanbarang,
          item.Tanggal_PengembalianBarang
        );

        if (remainingTime === "Expired") {
          return (
            <Badge colorScheme="danger" rounded="full">
              Expired
            </Badge>
          );
        } else {
          return (
            <Badge colorScheme="warning" rounded="full">
              {remainingTime}
            </Badge>
          );
        }
      } else {
        return (
          <Badge colorScheme="success" rounded="full">
            Accepted
          </Badge>
        );
      }
    } else if (item.status === "Dikembalikan") {
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

  // Handle incidental return
  const handleIncidentalReturn = (id) => {
    const database = getDatabase();
    const returnRef = ref(database, `Barang_Keluar/${id}`);

    update(returnRef, { status: "Dikembalikan" })
      .then(() => {
        toast.show({
          title: "Sukses",
          description: "Peminjaman berhasil Dikembalikan",
          status: "success",
        });
        fetchData(); // Refresh data
      })
      .catch((error) => {
        console.error("Error returning item:", error);
        toast.show({
          title: "Error",
          description: "Gagal mengembalikan peminjaman",
          status: "error",
        });
      });
  };

  // Function to open PDF directly
  const openPDF = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  // Item card component for displaying each barang keluar entry
  const ItemCard = ({ item }) => {
    // Calculate item count
    const itemCount = item.items?.length || 0;

    return (
      <Box
        bg={cardBg}
        rounded="xl"
        shadow={2}
        mb={4}
        overflow="hidden"
        borderWidth={1}
        borderColor="coolGray.200"
      >
        {/* Card Header */}
        <Box p={4}>
          <HStack justifyContent="space-between" alignItems="center" mb={2}>
            <VStack>
              <Heading size="sm" color={textColor}>
                {item.Nama_PihakPeminjam || "Tidak ada nama"}
              </Heading>
              <Text fontSize="xs" color={subtextColor}>
                {item.Kategori_Peminjaman || "Kategori tidak ada"}
              </Text>
            </VStack>
            {getStatusBadge(item)}
          </HStack>

          {/* Conditional Rendering of Tanggal Peminjaman for Reguler Kategori */}
          <HStack space={4} mt={3}>
            <VStack flex={1}>
              <Text fontSize="xs" color={subtextColor}>
                Tanggal Peminjaman
              </Text>
              <Text fontSize="sm" color={textColor}>
                {formatDate(item.tanggal_peminjamanbarang)}
              </Text>
            </VStack>

            {item.Kategori_Peminjaman?.toLowerCase() === "insidentil" && (
              <VStack flex={1}>
                <Text fontSize="xs" color={subtextColor}>
                  Tanggal Pengembalian
                </Text>
                <Text fontSize="sm" color={textColor}>
                  {formatDate(item.Tanggal_PengembalianBarang)}
                </Text>
              </VStack>
            )}
          </HStack>

          <HStack mt={4} space={2} alignItems="center">
            <Icon
              as={MaterialIcons}
              name="inventory"
              size="sm"
              color="coolGray.500"
            />
            <Text fontSize="sm" color={subtextColor}>
              {itemCount} {itemCount === 1 ? "barang" : "barang"}
            </Text>
          </HStack>

          <HStack mt={2} space={4}>
            {item.File_Surat ? (
              <Button
                size="xs"
                variant="subtle"
                colorScheme="secondary"
                leftIcon={<Icon as={FontAwesome5} name="file-alt" size="xs" />}
                onPress={() => openPDF(item.File_Surat)}
              >
                Lihat Surat
              </Button>
            ) : null}

            {item.File_BeritaAcara ? (
              <Button
                size="xs"
                variant="subtle"
                colorScheme="info"
                leftIcon={<Icon as={FontAwesome5} name="file-alt" size="xs" />}
                onPress={() => openPDF(item.File_BeritaAcara)}
              >
                Lihat BA
              </Button>
            ) : null}
          </HStack>
        </Box>

        {/* Card Footer */}
        <HStack
          justifyContent="space-between"
          p={3}
          bg="coolGray.50"
          borderTopWidth={1}
          borderTopColor="coolGray.100"
        >
          <Button
            size="sm"
            variant="ghost"
            colorScheme="blue"
            leftIcon={<Icon as={MaterialIcons} name="visibility" size="xs" />}
            onPress={() => {
              navigation.navigate("StafBarangDetail", { id: item.id });
            }}
          >
            Detail
          </Button>

          {/* Action buttons */}
          <HStack space={2}>
            {/* Create Berita Acara button - only show if no BA exists and status is Pending */}
            {!item.File_BeritaAcara && item.status === "Pending" && (
              <Button
                size="sm"
                variant="subtle"
                colorScheme="primary"
                leftIcon={<Icon as={FontAwesome5} name="file-alt" size="xs" />}
                onPress={() => {
                  navigation.navigate("BeritaAcara", { id: item.id });
                }}
              >
                Buat BA
              </Button>
            )}

            {/* Return button for incidental borrowing with Accepted status */}
            {item.status === "Accepted" &&
              item.Kategori_Peminjaman?.toLowerCase() === "insidentil" && (
                <Button
                  size="sm"
                  variant="subtle"
                  colorScheme="success"
                  leftIcon={<Icon as={FontAwesome5} name="check" size="xs" />}
                  onPress={() => handleIncidentalReturn(item.id)}
                >
                  Kembali
                </Button>
              )}
          </HStack>
        </HStack>
      </Box>
    );
  };

  // Use useEffect to fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Handle refresh
  const onRefresh = () => {
    fetchData();
  };

  return (
    <>
      <Header title="UID Jawa Timur" />
      <Box flex={1} bg="coolGray.50" safeArea>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        {/* Header */}
        <Box bg={primaryColor} p={4} roundedBottom="3xl" shadow={4}>
          <VStack space={4}>
            <HStack justifyContent="space-between" alignItems="center">
              <Heading size="md" color="white">
                Barang Keluar
              </Heading>
              <IconButton
                icon={
                  <Icon
                    as={Feather}
                    name="refresh-cw"
                    size="sm"
                    color="white"
                  />
                }
                borderRadius="full"
                variant="solid"
                bg={accentColor}
                onPress={fetchData}
                isLoading={isRefreshing}
              />
            </HStack>

            {/* Search Bar */}
            <Input
              placeholder="Cari peminjam atau barang..."
              variant="filled"
              bg="white:alpha.20"
              borderRadius="full"
              px={4}
              py={2}
              color="white"
              borderWidth={0}
              fontSize="sm"
              placeholderTextColor="coolGray.200"
              _focus={{
                bg: "white:alpha.30",
                borderColor: "transparent",
              }}
              InputLeftElement={
                <Icon
                  as={Ionicons}
                  name="search"
                  color="white"
                  size="sm"
                  ml={3}
                />
              }
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </VStack>
        </Box>

        {/* Status Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          mr={2}
          ml={2}
          pt={4}
        >
          <Box>
            <HStack space={2} flexWrap="wrap">
              <FilterButton
                label="Semua"
                statusValue="all"
                iconName="view-grid"
                isActive={filterStatus === "all"}
                onPress={setFilterStatus}
              />
              <FilterButton
                label="Aktif"
                statusValue="active"
                iconName="check-circle-outline"
                isActive={filterStatus === "active"}
                onPress={setFilterStatus}
              />
              <FilterButton
                label="Dikembalikan"
                statusValue="Dikembalikan"
                iconName="checkbox-marked-circle-outline"
                isActive={filterStatus === "Dikembalikan"}
                onPress={setFilterStatus}
              />
              <FilterButton
                label="Pending"
                statusValue="pending"
                iconName="clock-outline"
                isActive={filterStatus === "pending"}
                onPress={setFilterStatus}
              />
              <FilterButton
                label="Expired"
                statusValue="expired"
                iconName="alert-circle-outline"
                isActive={filterStatus === "expired"}
                onPress={setFilterStatus}
              />
              <FilterButton
                label="Insidentil Aktif"
                statusValue="active-insidentil"
                iconName="calendar-check"
                isActive={filterStatus === "active-insidentil"}
                onPress={setFilterStatus}
              />
            </HStack>
          </Box>
        </ScrollView>

        {/* Main Content */}
        <Box flex={30} px={4} pb={4}>
          {isRefreshing ? (
            <Center flex={1}>
              <Box
                p={4}
                borderRadius="xl"
                shadow={2}
                bg="white"
                alignItems="center"
              >
                <Text fontSize="lg" color={textColor} mb={3}>
                  Memuat Data
                </Text>
                <Center
                  w={16}
                  h={16}
                  borderRadius="full"
                  bg={`${primaryColor}:alpha.10`}
                >
                  <Icon
                    as={MaterialCommunityIcons}
                    name="package-variant"
                    size="3xl"
                    color={primaryColor}
                  />
                </Center>
              </Box>
            </Center>
          ) : filteredBarangKeluarList.length > 0 ? (
            <FlatList
              data={filteredBarangKeluarList}
              renderItem={({ item }) => <ItemCard item={item} />}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8 }}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                />
              }
            />
          ) : (
            <Center flex={1}>
              <Box
                p={6}
                borderRadius="xl"
                shadow={2}
                bg="white"
                alignItems="center"
              >
                <Icon
                  as={MaterialCommunityIcons}
                  name="package-variant-remove"
                  size="6xl"
                  color="coolGray.300"
                  mb={4}
                />
                <Text
                  fontSize="lg"
                  fontWeight="medium"
                  color={textColor}
                  mb={1}
                >
                  Tidak ada data ditemukan
                </Text>
                <Text textAlign="center" color={subtextColor} mb={4}>
                  {searchQuery
                    ? `Tidak ada hasil untuk "${searchQuery}"`
                    : "Barang keluar yang tersedia akan muncul di sini"}
                </Text>
                <Button
                  leftIcon={<Icon as={Feather} name="refresh-cw" size="sm" />}
                  onPress={fetchData}
                  colorScheme="blue"
                  borderRadius="full"
                  px={6}
                >
                  Muat Ulang
                </Button>
              </Box>
            </Center>
          )}
        </Box>

        {/* Floating Action Button */}
        <Box position="absolute" bottom={8} right={8}>
          <Pressable
            bg={primaryColor}
            shadow={6}
            borderRadius="full"
            p={4}
            onPress={() => navigation.navigate("CreateBarang")}
            _pressed={{ bg: accentColor }}
          >
            <Icon as={AntDesign} name="plus" color="white" size="lg" />
          </Pressable>
        </Box>
      </Box>
    </>
  );
};

export default StafBarang;
