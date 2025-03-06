import { 
  Text, Button, Box, VStack, Input, Heading, FormControl, StatusBar, Image, Center, useToast,
  Icon, Pressable, HStack
} from "native-base";
import React, { useState } from "react"; 
import { SafeAreaView } from "react-native-safe-area-context";
import { loginUser } from "../actions/AuthAction";
import { storeData } from "../utils";
import { Animated, Vibration } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shakeAnimation] = useState(new Animated.Value(0));
  const toast = useToast();

  const triggerShake = () => {
    Vibration.vibrate(100);
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // In Login.js
const login = async () => {
  if (email && password) {
    try {
      const users = await loginUser(email, password);

      if (users.status === 'Admin') {
        await storeData('userRole', 'Admin'); // Store with 'userRole' key
        navigation.replace('AdminTabs');
      } else if (users.status === 'Pegawai') {
        await storeData('userRole', 'Pegawai'); // Store with 'userRole' key
        navigation.replace('StaffTabs');
      } else {
        await storeData('userRole', 'UP3'); // Store with 'userRole' key
        navigation.replace('Tabs');
      }
    } catch (error) {
      setFormError('Email atau Password salah!');
      triggerShake();

      toast.show({
        title: "Login Gagal",
        description: "Mohon isi email dan password dengan benar!",
        status: "error",
        duration: 3000,
        placement: "top",
      });
    }
  } else {
    setFormError('Harap isi semua kolom!');
    triggerShake();

    toast.show({
      title: "Form Tidak Lengkap", 
      description: "Mohon isi email dan password sebelum login.",
      status: "warning",
      duration: 3000,
      placement: "top",
    });
  }
};
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F0F4F8' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F4F8" />
      <Center flex={1} px={6} mb={20}>
        <VStack space={8} width="100%" maxW="400px">
          <Center>
            <Image
              source={require("../assets/logo.png")}
              w={120}
              h={120}
              alt="Logo"
              resizeMode="contain"
            />
            <Heading fontSize="3xl" color="#004aad" mt={6} fontWeight="bold">
              Selamat Datang
            </Heading>
            <Text fontSize="md" color="gray.600" mt={2}>
              Silakan login untuk melanjutkan
            </Text>
          </Center>

          <Box
            width="100%"
            borderRadius={16}
            bgColor="white"
            shadow={3}
            p={6}
            style={{ elevation: 4 }}
          >
            <VStack space={5}>
              <FormControl isInvalid={!!formError}>
                <FormControl.Label>
                  <Text fontSize="sm" color="gray.700" fontWeight="medium">
                    Email
                  </Text>
                </FormControl.Label>
                <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
                  <Input
                    h={12}
                    borderRadius={12}
                    borderWidth={1}
                    fontSize="md"
                    bgColor="gray.50"
                    borderColor={formError ? "red.400" : "gray.200"}
                    _focus={{
                      borderColor: "#004aad",
                      backgroundColor: "white",
                    }}
                    placeholder="Masukkan Email"
                    value={email}
                    onChangeText={setEmail}
                    leftElement={
                      <Icon
                        as={MaterialIcons}
                        name="email"
                        size={5}
                        ml={3}
                        color="gray.400"
                      />
                    }
                  />
                </Animated.View>
              </FormControl>

              <FormControl isInvalid={!!formError}>
                <FormControl.Label>
                  <Text fontSize="sm" color="gray.700" fontWeight="medium">
                    Password
                  </Text>
                </FormControl.Label>
                <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
                  <Input
                    h={12}
                    borderRadius={12}
                    borderWidth={1}
                    fontSize="md"
                    bgColor="gray.50"
                    borderColor={formError ? "red.400" : "gray.200"}
                    _focus={{
                      borderColor: "#004aad",
                      backgroundColor: "white",
                    }}
                    placeholder="Masukkan Password"
                    value={password}
                    onChangeText={setPassword}
                    type={showPassword ? "text" : "password"}
                    leftElement={
                      <Icon
                        as={MaterialIcons}
                        name="lock"
                        size={5}
                        ml={3}
                        color="gray.400"
                      />
                    }
                    rightElement={
                      <Pressable onPress={() => setShowPassword(!showPassword)} mr={3}>
                        <Icon
                          as={MaterialIcons}
                          name={showPassword ? "visibility" : "visibility-off"}
                          size={5}
                          color="gray.400"
                        />
                      </Pressable>
                    }
                  />
                </Animated.View>
                {formError ? (
                  <HStack space={1} mt={1}>
                    <Icon
                      as={MaterialIcons}
                      name="error"
                      size={4}
                      color="red.500"
                    />
                    <FormControl.ErrorMessage>{formError}</FormControl.ErrorMessage>
                  </HStack>
                ) : null}
              </FormControl>

              <Button
                h={12}
                borderRadius={12}
                bgColor="#004aad"
                _pressed={{ bgColor: "#003280" }}
                _text={{ 
                  color: "white", 
                  fontSize: "md",
                  fontWeight: "bold" 
                }}
                onPress={login}
                shadow={2}
              >
                Login
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Center>
    </SafeAreaView>
  );
};

export default Login;