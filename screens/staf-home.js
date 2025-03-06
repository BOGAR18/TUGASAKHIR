import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { Box, Text, Heading, VStack, HStack, Icon, Divider } from "native-base";
import Header from "../components/header";
import { MaterialIcons } from "@expo/vector-icons";
import FIREBASE from "../actions/config/FIREBASE";
import { getData } from "../utils";
import { useNavigation } from "@react-navigation/native";

const Dashboard = () => {
    const navigation = useNavigation();
    const [userData, setUserData] = useState(null);
    const [dashboardStats, setDashboardStats] = useState({
        barangMasuk: {
            total: 0,
            pending: 0,
            accepted: 0
        },
        barangKeluar: {
            total: 0,
            pending: 0,
            insidentil: 0,
            reguler: 0
        },
        barangRetur: {
            total: 0,
            pending: 0,
            bekasHandal: 0,
            bekasBergaransi: 0,
            barangRusak: 0
        }
    });

    const fetchDashboardData = async () => {
        try {
            // Fetch user data
            const user = await getData("user");
            if (user) {
                const userRef = FIREBASE.database().ref(`users/${user.uid}`);
                const userSnapshot = await userRef.once("value");
                setUserData(userSnapshot.val());
            }

            // Fetch Barang Masuk stats
            const barangMasukRef = FIREBASE.database().ref('barang_masuk');
            const barangMasukSnapshot = await barangMasukRef.once("value");
            const barangMasukData = barangMasukSnapshot.val();

            // Fetch Barang Keluar stats
            const barangKeluarRef = FIREBASE.database().ref('Barang_Keluar');
            const barangKeluarSnapshot = await barangKeluarRef.once("value");
            const barangKeluarData = barangKeluarSnapshot.val();

            // Fetch Retur Barang stats
            const returBarangRef = FIREBASE.database().ref('Retur_Barang');
            const returBarangSnapshot = await returBarangRef.once("value");
            const returBarangData = returBarangSnapshot.val();

            // Process Barang Masuk
            const barangMasukStats = processBarangMasuk(barangMasukData);
            
            // Process Barang Keluar
            const barangKeluarStats = processBarangKeluar(barangKeluarData);
            
            // Process Barang Retur
            const barangReturStats = processBarangRetur(returBarangData);

            // Update state with processed stats
            setDashboardStats({
                barangMasuk: barangMasukStats,
                barangKeluar: barangKeluarStats,
                barangRetur: barangReturStats
            });

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
    };

    const processBarangMasuk = (data) => {
        let total = 0;
        let pending = 0;
        let accepted = 0;

        if (data) {
            Object.values(data).forEach(item => {
                if (item.barang && Array.isArray(item.barang)) {
                    item.barang.forEach(barangItem => {
                        // Total items
                        if (barangItem.jumlah_barang) {
                            total += parseInt(barangItem.jumlah_barang);
                        }

                        // Status counting
                        if (barangItem.Status) {
                            if (barangItem.Status.toLowerCase() === 'pending') {
                                pending++;
                            } else if (barangItem.Status.toLowerCase() === 'accept') {
                                accepted++;
                            }
                        }
                    });
                }
            });
        }

        return { total, pending, accepted };
    };

    const processBarangKeluar = (data) => {
        let total = 0;
        let pending = 0;
        let insidentil = 0;
        let reguler = 0;

        if (data) {
            Object.values(data).forEach(item => {
                // Count total barang keluar
                if (item.status === 'Accepted' && item.barang) {
                    item.barang.forEach(barangItem => {
                        if (barangItem.jumlah_barang) {
                            total += parseInt(barangItem.jumlah_barang);
                        }
                    });
                }

                // Count pending
                if (item.status === 'Pending') {
                    pending++;
                }

                // Count peminjaman types
                if (item.status === 'Accepted') {
                    if (item.Kategori_Peminjaman === 'Insidentil') {
                        insidentil++;
                    } else if (item.Kategori_Peminjaman === 'Reguler') {
                        reguler++;
                    }
                }
            });
        }

        return { total, pending, insidentil, reguler };
    };

    const processBarangRetur = (data) => {
        let total = 0;
        let pending = 0;
        let bekasHandal = 0;
        let bekasBergaransi = 0;
        let barangRusak = 0;

        if (data) {
            Object.values(data).forEach(item => {
                // Count accepted returns
                if (item.status === 'Accepted') {
                    total++;

                    // Count by category
                    if (item.Kategori_Retur === 'Bekas Handal') {
                        bekasHandal += parseInt(item.jumlah_barang || 0);
                    } else if (item.Kategori_Retur === 'Bekas Bergaransi') {
                        bekasBergaransi += parseInt(item.jumlah_barang || 0);
                    } else if (item.Kategori_Retur === 'Barang Rusak') {
                        barangRusak += parseInt(item.jumlah_barang || 0);
                    }
                }

                // Count pending
                if (item.status === 'Pending') {
                    pending++;
                }
            });
        }

        return { total, pending, bekasHandal, bekasBergaransi, barangRusak };
    };

    useEffect(() => {
        fetchDashboardData();
        const unsubscribe = navigation.addListener("focus", fetchDashboardData);
        return () => {
            unsubscribe();
        };
    }, [navigation]);

    const StatCard = ({ title, data, iconName, color }) => (
        <Box 
            bg="white" 
            rounded="xl" 
            shadow={2} 
            p={4} 
            mb={3}
        >
            <HStack alignItems="center" space={3}>
                <Icon 
                    as={MaterialIcons} 
                    name={iconName} 
                    size={6} 
                    color={color} 
                />
                <VStack flex={1}>
                    <Text fontSize="md" fontWeight="bold" color="gray.700">{title}</Text>
                    <Divider my={2} />
                    <HStack justifyContent="space-between">
                        <VStack>
                            <Text fontSize="sm" color="gray.500">Total</Text>
                            <Text fontSize="md" fontWeight="semibold">{data.total}</Text>
                        </VStack>
                        <VStack>
                            <Text fontSize="sm" color="gray.500">Pending</Text>
                            <Text fontSize="md" fontWeight="semibold">{data.pending}</Text>
                        </VStack>
                    </HStack>
                </VStack>
            </HStack>
        </Box>
    );

    return (
        <Box flex={1} bg="white">
            <ScrollView showsVerticalScrollIndicator={false}>
                <Header title={"Dashboard"} />
                
                {/* Welcome Section */}
                <Box 
                    bg={"blue.500"}
                    pt={6}
                    pb={20}
                    px={6}
                >
                    <VStack space={2}>
                        <Text fontSize="md" color="blue.100" bold>
                            Selamat Datang
                        </Text>
                        <Text fontSize="3xl" color="white" fontWeight="bold" numberOfLines={1}>
                            {userData?.name || "Admin"}
                        </Text>
                    </VStack>
                </Box>

                {/* Dashboard Stats */}
                <Box px={6} mt={-16}>
                    <Heading size="md" mb={4} color="gray.700">Gudang UID Jatim</Heading>
                    
                    <StatCard 
                        title="Barang Masuk" 
                        data={dashboardStats.barangMasuk} 
                        iconName="add-box" 
                        color="green.500" 
                    />
                    
                    <StatCard 
                        title="Barang Keluar" 
                        data={dashboardStats.barangKeluar} 
                        iconName="exit-to-app" 
                        color="red.500" 
                    />
                    
                    <StatCard 
                        title="Retur Barang" 
                        data={dashboardStats.barangRetur} 
                        iconName="restore" 
                        color="orange.500" 
                    />
                </Box>
            </ScrollView>
        </Box>
    );
};

export default Dashboard;