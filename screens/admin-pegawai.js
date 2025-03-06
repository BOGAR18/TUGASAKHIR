import React, { useState } from "react";
import {
  Box,
  Input,
  FormControl,
  Button,
  VStack,
  Text,
  Select,
  Heading,
  Icon,
  ScrollView,
  Modal,
  useToast,
  IconButton,
  HStack,
  Divider,
} from "native-base";
import { useNavigation } from "@react-navigation/native";
import { registerUser } from "../actions/AuthAction";
import { MaterialIcons, Feather } from "@expo/vector-icons";

const FormInput = ({ label, icon, isPassword, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormControl>
      <FormControl.Label _text={{ fontSize: "sm", fontWeight: "medium" }}>
        {label}
      </FormControl.Label>
      <Input
        {...props}
        InputLeftElement={
          <Icon as={Feather} name={icon} size={5} ml={4} color="gray.400" />
        }
        InputRightElement={
          isPassword ? (
            <IconButton
              icon={
                <Icon
                  as={MaterialIcons}
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={5}
                  mr={2}
                  color="gray.400"
                />
              }
              onPress={() => setShowPassword(!showPassword)}
            />
          ) : null
        }
        secureTextEntry={isPassword && !showPassword}
        fontSize="sm"
        bg="gray.50"
        borderRadius="lg"
        p={3}
        borderWidth={1}
        borderColor="gray.200"
        _focus={{
          bg: "white",
          borderColor: "blue.400",
        }}
      />
    </FormControl>
  );
};

const AdminPegawai = () => {
  const navigation = useNavigation();
  const toast = useToast();
  const [nama, setNama] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("");
  const [noTelepon, setNoTelepon] = useState("");
  const [alamat, setAlamat] = useState("");
  const [instansi, setInstansi] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async () => {
    if (!nama || !jenisKelamin || !noTelepon || !alamat || !email || !password || !confirmPassword) {
      toast.show({
        description: "Mohon lengkapi semua field",
        placement: "top",
        bg: "red.500",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.show({
        description: "Password tidak cocok",
        placement: "top",
        bg: "red.500",
      });
      return;
    }

    const newUser = {
      name: nama,
      jenis_kelamin: jenisKelamin,
      nomorhp: noTelepon,
      alamat,
      instansi,
      email,
      status: "Pegawai",
    };

    try {
      await registerUser(newUser, password);
      setShowModal(true);
    } catch (error) {
      toast.show({
        description: error.message,
        placement: "top",
        bg: "red.500",
      });
    }
  };

  return (
    <ScrollView flex={1} bg="gray.50">
      <Box safeArea p={6} flex={1}>
        <Box 
          w="100%" 
          p={6} 
          bg="white" 
          shadow={2}
          rounded="2xl"
          borderWidth={1}
          borderColor="gray.100"
        >
          <VStack space={6}>
            <Box alignItems="center">
              <Icon 
                as={MaterialIcons} 
                name="person-add" 
                size={16} 
                color="blue.500" 
                mb={2}
              />
              <Heading size="lg" color="gray.800">
                Tambah Akun Pegawai
              </Heading>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Lengkapi data untuk membuat akun pegawai baru
              </Text>
            </Box>

            <Divider />

            <VStack space={4}>
              <FormInput
                label="Nama Lengkap"
                icon="user"
                value={nama}
                onChangeText={setNama}
                placeholder="Masukkan nama lengkap"
              />

              <FormControl>
                <FormControl.Label _text={{ fontSize: "sm", fontWeight: "medium" }}>
                  Jenis Kelamin
                </FormControl.Label>
                <Select
                  selectedValue={jenisKelamin}
                  onValueChange={setJenisKelamin}
                  placeholder="Pilih Jenis Kelamin"
                  fontSize="sm"
                  bg="gray.50"
                  borderRadius="lg"
                  p={3}
                  borderWidth={1}
                  borderColor="gray.200"
                  _selectedItem={{
                    bg: "blue.100",
                    endIcon: <Icon as={MaterialIcons} name="check" size={5} />,
                  }}
                  leftIcon={
                    <Icon as={Feather} name="users" size={5} ml={2} color="gray.400" />
                  }
                >
                  <Select.Item label="Laki-laki" value="Laki-laki" />
                  <Select.Item label="Perempuan" value="Perempuan" />
                </Select>
              </FormControl>

              <FormInput
                label="Nomor Telepon"
                icon="phone"
                value={noTelepon}
                onChangeText={setNoTelepon}
                placeholder="Masukkan nomor telepon"
                keyboardType="phone-pad"
              />

              <FormInput
                label="Alamat"
                icon="map-pin"
                value={alamat}
                onChangeText={setAlamat}
                placeholder="Masukkan alamat lengkap"
              />

              <FormInput
                label="Instansi"
                icon="briefcase"
                value={instansi}
                onChangeText={setInstansi}
                placeholder="Masukkan nama instansi"
              />

              <FormInput
                label="Email"
                icon="mail"
                value={email}
                onChangeText={setEmail}
                placeholder="Masukkan alamat email"
                keyboardType="email-address"
              />

              <FormInput
                label="Password"
                icon="lock"
                value={password}
                onChangeText={setPassword}
                placeholder="Masukkan password"
                isPassword
              />

              <FormInput
                label="Konfirmasi Password"
                icon="lock"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Konfirmasi password"
                isPassword
              />
            </VStack>

            <Button
              onPress={handleSubmit}
              bg="blue.600"
              _pressed={{ bg: "blue.700" }}
              py={3}
              _text={{ fontSize: "sm" }}
              borderRadius="lg"
              shadow={2}
              leftIcon={<Icon as={MaterialIcons} name="add" size="sm" />}
            >
              Tambah Akun Pegawai
            </Button>
          </VStack>
        </Box>
      </Box>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <Modal.Content maxWidth="400px" borderRadius="2xl">
          <Box bg="blue.500" p={4} borderTopRadius="2xl">
            <HStack alignItems="center" space={2}>
              <Icon as={MaterialIcons} name="check-circle" size={6} color="white" />
              <Text color="white" fontSize="lg" fontWeight="bold">
                Sukses
              </Text>
            </HStack>
          </Box>
          <Modal.Body py={4}>
            <VStack space={3} alignItems="center">
              <Text fontSize="md" textAlign="center">
                Akun pegawai berhasil dibuat!
              </Text>
              <Button
                w="full"
                bg="blue.500"
                _pressed={{ bg: "blue.600" }}
                onPress={() => {
                  setShowModal(false);
                  navigation.navigate("Akun");
                }}
                borderRadius="lg"
              >
                Kembali ke Daftar Akun
              </Button>
            </VStack>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </ScrollView>
  );
};

export default AdminPegawai;