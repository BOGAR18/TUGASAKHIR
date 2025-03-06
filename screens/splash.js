import { StyleSheet, View, Image } from 'react-native';
import React, { useEffect } from 'react';
import { getData } from '../utils';

const Splash = ({ navigation }) => {
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        // Ambil data role dari local storage
        const userRole = await getData('userRole');

        if (userRole) {
          // Navigasi berdasarkan role yang ditemukan
          if (userRole === 'Admin') {
            navigation.replace('AdminTabs'); // Arahkan ke AdminTabs jika admin
          } else if (userRole === 'Pegawai') {
            navigation.replace('StaffTabs'); // Arahkan ke StaffTabs jika pegawai
          } else {
            navigation.replace('Tabs'); // Arahkan ke Tabs jika user
          }
        } else {
          navigation.replace('Login'); // Jika tidak ada userRole, arahkan ke Login
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        navigation.replace('Login'); // Jika ada error, arahkan ke Login
      }
    };

    // Periksa status user saat komponen di-mount
    checkUserStatus();
  }, [navigation]);

  return (
    <View style={styles.pages}>
      <Image 
        source={require('../assets/inventory.jpg')} 
        style={styles.image} 
        resizeMode="contain" 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  pages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff', // Warna latar belakang untuk splash screen
  },
  image: {
    width: 200, // Sesuaikan ukuran gambar sesuai kebutuhan
    height: 200,
  },
});

export default Splash;
