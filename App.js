import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { NativeBaseProvider, Text } from "native-base";
import Ionicons from "@expo/vector-icons/Ionicons";
// Import custom screens
import Home from "./screens/home";
import Barang from "./screens/barang";
import Profile from "./screens/profile";
import Splash from "./screens/splash";
import CreateBarang from "./screens/createbarang";
import Login from "./screens/login";
import Register from "./screens/register";
import Retur from "./screens/retur";
import CreateRetur from "./screens/createRetur";
import StafHome from "./screens/staf-home";
import StafBarang from "./screens/staf-barang";
import StafProfile from "./screens/staf-profile";
import AdminAkun from "./screens/admin-akun";
import AdminPegawai from "./screens/admin-pegawai";
import AdminUp3 from "./screens/admin-up3";
import AdminProfile from "./screens/admin-profile";
import AdminNotifikasi from "./screens/admin-notifikasi";
import StafBarangDetail from "./screens/staf-barangdetail.js";
import BeritaAcara from "./screens/staf-beritaacara.js";

// Navigator Declaration
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const noHead = { headerShown: false };

// Custom button for the middle tab
const CustomTabBarButton = ({ children, onPress }) => (
  <TouchableOpacity
    style={{
      top: -25,
      justifyContent: "center",
      alignItems: "center",
      ...styles.shadow,
    }}
    onPress={onPress}
  >
    <View
      style={{
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#24a8e0",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {children}
    </View>
  </TouchableOpacity>
);

// Bottom Tabs Navigator
const Tabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          switch (route.name) {
            case "Home":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Profile":
              iconName = focused ? "person" : "person-outline";
              break;
            case "Barang":
              iconName = focused ? "cube" : "cube-outline";
              break;
          }
          return (
            <Ionicons
              name={iconName}
              size={route.name === "Barang" ? 30 : 24}
              color={focused ? "#2563eb" : "#64748b"}
            />
          );
        },
        tabBarIconStyle: { 
          marginTop: 10,
        },
        tabBarStyle: {
          height: 75,
          paddingBottom: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0, 0, 0, 0.1)',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabel: ({ focused }) => (
          <Text
            style={{
              fontSize: 12,
              fontWeight: focused ? '600' : '400',
              color: focused ? '#2563eb' : '#64748b',
              marginTop: 4,
            }}
          >
            {route.name}
          </Text>
        ),
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
      })}
    >
      <Tab.Screen name="Home" component={Home} options={noHead} />
      <Tab.Screen
        name="Barang"
        component={Barang}
        options={{
          headerShown: false,
          tabBarButton: (props) => (
            <CustomTabBarButton {...props}>
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                // backgroundColor: '#2563eb',
                borderRadius: 30,
                padding: 15,
                elevation: 5,
                shadowColor: '#2563eb',
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.3,
                shadowRadius: 5,
              }}>
                <Ionicons name="cube" size={30} color="white" />
                <Text style={{
                  color: 'white',
                  fontSize: 12,
                  fontWeight: '600',
                  marginTop: 4,
                }}>
                  Barang
                </Text>
              </View>
            </CustomTabBarButton>
          )
        }}
      />
      <Tab.Screen name="Profile" component={Profile} options={noHead} />
    </Tab.Navigator>
  );
};

// Bottom Tabs for Admin
const AdminTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          switch (route.name) {
            case "Akun":
              iconName = focused ? "stats-chart" : "stats-chart-outline";
              break;
            case "Notifikasi":
              iconName = focused ? "people" : "people-outline";
              break;
            case "Profile":
              iconName = focused ? "person" : "person-outline";
              break;
          }
          return (
            <Ionicons 
              name={iconName} 
              size={24} 
              color={focused ? "#2563eb" : "#64748b"} 
            />
          );
        },
        tabBarStyle: {
          height: 75,
          paddingBottom: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0, 0, 0, 0.1)',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabel: ({ focused }) => (
          <Text
            style={{
              fontSize: 12,
              fontWeight: focused ? '600' : '400',
              color: focused ? '#2563eb' : '#64748b',
              marginTop: 4,
            }}
          >
            {route.name}
          </Text>
        ),
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
      })}
    >
      <Tab.Screen name="Akun" component={AdminAkun} options={noHead} />
      <Tab.Screen name="Notifikasi" component={AdminNotifikasi} options={noHead} />
      <Tab.Screen name="Profile" component={AdminProfile} options={noHead} />
    </Tab.Navigator>
  );
};

// Bottom Tabs for Staff Gudang
const StaffTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          switch (route.name) {
            case "Home":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Barang":
              iconName = focused ? "cube" : "cube-outline";
              break;
            case "Profile":
              iconName = focused ? "person" : "person-outline";
              break;
          }
          return (
            <Ionicons 
              name={iconName} 
              size={24} 
              color={focused ? "#2563eb" : "#64748b"} 
            />
          );
        },
        tabBarStyle: {
          height: 75,
          paddingBottom: 5,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0, 0, 0, 0.1)',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabel: ({ focused }) => (
          <Text
            style={{
              fontSize: 12,
              fontWeight: focused ? '600' : '400',
              color: focused ? '#2563eb' : '#64748b',
              marginTop: 4,
            }}
          >
            {route.name}
          </Text>
        ),
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
      })}
    >
      <Tab.Screen name="Home" component={StafHome} options={noHead} />
      <Tab.Screen name="Barang" component={StafBarang} options={noHead} />
      <Tab.Screen name="Profile" component={StafProfile} options={noHead} />
    </Tab.Navigator>
  );
};

// Main App component with Stack Navigator
const App = () => {
  return (
    <NativeBaseProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash">
          <Stack.Screen name="Splash" component={Splash} options={noHead} />
          <Stack.Screen name="Tabs" component={Tabs} options={noHead} />
          <Stack.Screen name="AdminTabs" component={AdminTabs} options={noHead} />
          <Stack.Screen name="StaffTabs" component={StaffTabs} options={noHead} />
          <Stack.Screen name="Login" component={Login} options={noHead} />
          <Stack.Screen name="CreateBarang" component={CreateBarang} options={noHead} />
          <Stack.Screen name="Register" component={Register} options={noHead} />
          <Stack.Screen name="Retur" component={Retur} options={noHead} />
          <Stack.Screen name="CreateRetur" component={CreateRetur} options={noHead} />
          {/* <Stack.Screen name="Maps" component={Maps} options={noHead} /> */}
          <Stack.Screen name="AdminUp3" component={AdminUp3} options={noHead} />
          <Stack.Screen name="AdminPegawai" component={AdminPegawai} options={noHead} />

          <Stack.Screen name="StafBarangDetail" component={StafBarangDetail} options={noHead} />
          <Stack.Screen name="StafBarang" component={StafBarang} options={noHead} />

          <Stack.Screen name="BeritaAcara" component={BeritaAcara} options={noHead} />
        </Stack.Navigator>
      </NavigationContainer>
    </NativeBaseProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#24a8e0",
    shadowOffset: {
      width: 0,
      height: 100,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
  textIcon: {
    marginTop: 5,
    color: 'white',
  },
});
