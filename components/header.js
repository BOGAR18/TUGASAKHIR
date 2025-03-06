import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { Box, HStack, Image, Heading } from "native-base";
import { TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

const Header = ({ route, title, withBack = false, }) => {
    const trueGray900 = "#24a8e0";
    const navigation = useNavigation();


    return (
        <SafeAreaView>
            <StatusBar barStyle="light" backgroundColor={trueGray900} />
            <Box bg={"#fff"} p={"3"} borderBottomWidth={1} borderColor={"gray.300"}>
                <HStack justifyContent="space-between" alignItems="center">
                    <HStack alignItems="center">
                        {!withBack ? (
                            <>
                               
                            </>
                        ) : (
                            <TouchableOpacity
                                activeOpacity={0.5}
                                onPress={() => navigation.goBack()}
                            >
                                <Box mr={"3"}>
                                    <Ionicons name="arrow-back-outline" size={32} color="black" />
                                </Box>
                            </TouchableOpacity>
                        )}
                        <Heading color={"black"}>{title}</Heading>
                    </HStack>
                    <HStack position="absolute" right="4">
                    </HStack>
                     <Image
                                    source={require("../assets/pln.png")}
                                    w="10"
                                    h="12"
                                    alt="PLN LOGO"
                                    mr={"3"}
                                />
                </HStack>
            </Box>
        </SafeAreaView>
    );
};

export default Header;
