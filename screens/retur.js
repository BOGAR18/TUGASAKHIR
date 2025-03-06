import React, { useState, useEffect } from "react";
import { ScrollView, RefreshControl } from "react-native";
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Center,
  Icon,
  Badge,
  Pressable,
  useToast,
  Skeleton,
  Divider,
} from "native-base";
import { getDatabase, ref, onValue } from "firebase/database";
import Header from "../components/header";
import { MaterialIcons } from "@expo/vector-icons";
import FIREBASE from "../actions/config/FIREBASE";
import { getData } from "../utils";

const Retur = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [returData, setReturData] = useState([]);
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
    const ReturBarangRef = ref(database, "Retur_Barang");

    const unsubscribe = onValue(ReturBarangRef, (snapshot) => {
      const returBarangData = snapshot.val();
      if (returBarangData) {
        const returArray = Object.entries(returBarangData)
          .map(([key, value]) => ({
            id: key,
            ...value,
          }))
          .filter((item) => item.userId === user.uid);

        setReturData(returArray);
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
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const StatusBadge = ({ status }) => (
    <Badge
      colorScheme={status === "Accepted" ? "success" : "warning"}
      variant="subtle"
      rounded="full"
      px={3}
      py={1}
      _text={{
        fontSize: "xs",
        fontWeight: "bold",
      }}
    >
      {status === "Accepted" ? "Diterima" : "Pending"}
    </Badge>
  );

  const ReturCard = ({ item }) => (
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
                {item.nama_barang}
              </Text>
              <Text fontSize="sm" color="gray.600">
                {item.Pihak_Pemohon}
              </Text>
            </VStack>
            <StatusBadge status={item.status} />
          </HStack>

          <HStack space={6} mb={expanded[item.id] ? 4 : 0}>
            <HStack space={2} alignItems="center">
              <Icon as={MaterialIcons} name="event" size="sm" color="gray.500" />
              <Text fontSize="sm" color="gray.600">
                {item.Tanggal_Retur || "Tidak Ada"}
              </Text>
            </HStack>
            <HStack space={2} alignItems="center">
              <Icon as={MaterialIcons} name="inventory" size="sm" color="gray.500" />
              <Text fontSize="sm" color="gray.600">
                {item.jumlah_barang} Unit
              </Text>
            </HStack>
          </HStack>

          {expanded[item.id] && (
            <VStack space={4} mt={4}>
              <Divider />
              
              <VStack space={3}>
                <Text fontSize="md" fontWeight="semibold" color="gray.700">
                  Detail Barang
                </Text>
                <Box
                  bg="gray.50"
                  p={4}
                  rounded="lg"
                  borderWidth={1}
                  borderColor="gray.200"
                >
                  <VStack space={3}>
                    <HStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="md" fontWeight="semibold" color="gray.800">
                        {item.nama_barang}
                      </Text>
                      <Badge colorScheme="blue" variant="subtle">
                        {item.kode_barang}
                      </Badge>
                    </HStack>
                    
                    <HStack space={4}>
                      <VStack>
                        <Text fontSize="xs" color="gray.500">Kategori</Text>
                        <Text fontSize="sm" color="gray.700">{item.kategori_barang}</Text>
                      </VStack>
                      {item.status === "Accepted" && (
                        <VStack>
                          <Text fontSize="xs" color="gray.500">Jumlah Disetujui</Text>
                          <Text fontSize="sm" color="gray.700">{item.jumlah_barang_diretur || "0"}</Text>
                        </VStack>
                      )}
                    </HStack>

                    <Box bg="gray.100" p={3} rounded="md">
                      <Text fontSize="xs" color="gray.500">Catatan</Text>
                      <Text fontSize="sm" color="gray.700">
                        {item.Deskripsi || "Tidak ada catatan"}
                      </Text>
                    </Box>
                  </VStack>
                </Box>
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
      <Header title="UID Jawa Timur" withBack={true} />
      <Box flex={1} bg="gray.100">
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Box bg="blue.600" p={4}>
            <HStack justifyContent="space-between" alignItems="center">
              <VStack space={1}>
                <Text fontSize="2xl" color="white" fontWeight="bold">
                  Retur Barang
                </Text>
                <Text fontSize="sm" color="white" opacity={0.9}>
                  Sistem Manajemen Inventaris
                </Text>
              </VStack>
            </HStack>
          </Box>

          <Box p={4}>
            {loading ? (
              <LoadingSkeleton />
            ) : returData.length > 0 ? (
              returData.map((item) => <ReturCard key={item.id} item={item} />)
            ) : (
              <Center py={12}>
                <Icon as={MaterialIcons} name="inventory" size="4xl" color="gray.300" />
                <Text fontSize="lg" color="gray.500" mt={4}>
                  Tidak ada data retur barang
                </Text>
              </Center>
            )}
          </Box>
        </ScrollView>
      </Box>
    </>
  );
};

export default Retur;