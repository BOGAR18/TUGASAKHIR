import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { Box, Image, Text, Heading, VStack, Icon, Button, HStack } from "native-base";
import Header from "../components/header";
import { MaterialIcons } from "@expo/vector-icons";
import FIREBASE from "../actions/config/FIREBASE";
import { getData } from "../utils";
import { useNavigation } from "@react-navigation/native";

const Home = () => {
    const navigation = useNavigation();
    const [Home, setHome] = useState(null);

    const getUserData = async () => {
        try {
            const userData = await getData("user");
            if (userData) {
                const userRef = FIREBASE.database().ref(`users/${userData.uid}`);
                const snapshot = await userRef.once("value");
                const updatedUserData = snapshot.val();
                if (updatedUserData) {
                    setHome(updatedUserData);
                } else {
                    console.log("User data not found");
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", getUserData);
        return () => {
            unsubscribe();
        };
    }, [navigation]);

    return (
        <Box flex={1} bg="white">
            <ScrollView showsVerticalScrollIndicator={false}>
                <Header title={"Home"} />
                
                {/* Hero Section with Gradient */}
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
                            {Home?.name}
                        </Text>
                    </VStack>
                </Box>

                {/* Main Content Cards */}
                <Box px={6} mt={-16}>
                    {/* Stats Card */}
                    <Box 
                        bg="white" 
                        rounded="2xl" 
                        shadow={3}
                        p={6}
                        mb={6}
                    >
                        <Image
                            size="lg"
                            resizeMode="contain"
                            source={require("../assets/inventory.jpg")}
                            alt="PLN Logo"
                            alignSelf="center"
                            mb={4}
                            borderWidth={2} 
                            borderRadius={"full"}
                        />
                        
                        <Heading 
                            size="lg" 
                            color="blue.800" 
                            textAlign="center"
                            mb={4}
                        >
                            Sistem Inventory UID JATIM
                        </Heading>

                        <Text 
                            fontSize="sm" 
                            color="gray.600" 
                            textAlign="center"
                            mb={6}
                        >
                             Akses data inventaris Anda kapan saja dan di mana saja.
                        </Text>

                        {/* Quick Stats */}
                        <HStack justifyContent="space-between" mb={4}>
                            <Box 
                                bg="blue.50" 
                                p={4} 
                                rounded="xl" 
                                flex={1} 
                                mr={2}
                                alignItems="center"
                            >
                                <Icon 
                                    as={MaterialIcons} 
                                    name="inventory" 
                                    size={6} 
                                    color="blue.500" 
                                    mb={2}
                                />
                                <Text color="blue.800" fontSize="sm" fontWeight="semibold">
                                    Real-time
                                </Text>
                            </Box>
                            <Box 
                                bg="blue.50" 
                                p={4} 
                                rounded="xl" 
                                flex={1} 
                                ml={2}
                                alignItems="center"
                            >
                                <Icon 
                                    as={MaterialIcons} 
                                    name="local-shipping" 
                                    size={6} 
                                    color="blue.500" 
                                    mb={2}
                                />
                                <Text color="blue.800" fontSize="sm" fontWeight="semibold">
                                    Transparan
                                </Text>
                            </Box>
                        </HStack>
                    </Box>

                    {/* Action Buttons */}
                    <VStack space={4} mb={6}>
                        <Button
                            size="lg"
                            bg="blue.600"
                            _pressed={{ bg: "blue.700" }}
                            leftIcon={<Icon as={MaterialIcons} name="add-shopping-cart" size="sm" />}
                            onPress={() => navigation.navigate('Barang')}
                            py={4}
                            rounded="xl"
                            shadow={2}
                        >
                            Ajukan Permintaan Barang
                        </Button>
                        
                        <Button
                            size="lg"
                            bg="white"
                            borderWidth={1}
                            borderColor="blue.600"
                            _pressed={{ bg: "blue.50" }}
                            leftIcon={
                                <Icon 
                                    as={MaterialIcons} 
                                    name="inventory" 
                                    size="sm" 
                                    color="blue.600" 
                                />
                            }
                            onPress={() => navigation.navigate('Retur')}
                            _text={{ color: "blue.600" }}
                            py={4}
                            rounded="xl"
                            shadow={1}
                        >
                            Barang Retur
                        </Button>
                    </VStack>
                </Box>
            </ScrollView>
        </Box>
    );
};

export default Home;