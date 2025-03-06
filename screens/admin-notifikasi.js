import React, { useState, useEffect } from "react";
import { ScrollView, Box, Heading, Text, VStack, HStack, Icon, Pressable, Divider } from "native-base";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import FIREBASE from "../actions/config/FIREBASE";

const NotificationCard = ({ log }) => {
  const getLogColor = (type) => {
    switch (type.toLowerCase()) {
      case "login":
        return "green.500";
      case "logout":
        return "red.500";
      default:
        return "blue.500";
    }
  };

  const getLogIcon = (type) => {
    switch (type.toLowerCase()) {
      case "login":
        return "log-in";
      case "logout":
        return "log-out";
      default:
        return "activity";
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return {
      time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    };
  };

  const { time, date } = formatTimestamp(log.timestamp);

  return (
    <Pressable>
      {({ isPressed }) => (
        <Box
          bg={isPressed ? "gray.50" : "white"}
          p={4}
          borderRadius="2xl"
          shadow="2"
          borderWidth={1}
          borderColor="gray.100"
          mb={3}
        >
          <HStack space={4} alignItems="center">
            <Box
              bg={`${getLogColor(log.type)}:alpha.10`}
              p={3}
              borderRadius="xl"
            >
              <Icon
                as={Feather}
                name={getLogIcon(log.type)}
                size={6}
                color={getLogColor(log.type)}
              />
            </Box>
            
            <VStack flex={1} space={1}>
              <HStack justifyContent="space-between" alignItems="center">
                <Text
                  fontSize="md"
                  fontWeight="bold"
                  color="gray.800"
                >
                  {log.name}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {time}
                </Text>
              </HStack>
              
              <HStack justifyContent="space-between" alignItems="center">
                <HStack space={2} alignItems="center">
                  <Text
                    fontSize="sm"
                    color="gray.600"
                    textTransform="capitalize"
                  >
                    {log.type}
                  </Text>
                  <Text fontSize="sm" color="gray.400">•</Text>
                  <Text
                    fontSize="sm"
                    color="gray.600"
                    bg={`${getLogColor(log.type)}:alpha.10`}
                    px={2}
                    py={0.5}
                    borderRadius="full"
                  >
                    {log.status}
                  </Text>
                </HStack>
                <Text fontSize="xs" color="gray.500">
                  {date}
                </Text>
              </HStack>
            </VStack>
          </HStack>
        </Box>
      )}
    </Pressable>
  );
};

const AdminNotifikasi = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const logsRef = FIREBASE.database().ref("logs");

    const onDataChange = (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedLogs = Object.values(data).reverse();
        setLogs(formattedLogs);
      } else {
        setLogs([]);
      }
    };

    logsRef.on("value", onDataChange);
    return () => logsRef.off("value", onDataChange);
  }, []);

  return (
    <ScrollView 
      bg="gray.50" 
      _contentContainerStyle={{ pb: 6 }}
    >
      <Box safeArea px={4} pt={4}>
        <VStack space={6}>
          {/* Header Section */}
          <Box>
            <HStack 
              bg="white" 
              p={4} 
              borderRadius="2xl" 
              shadow="2"
              borderWidth={1}
              borderColor="gray.100"
              space={4}
              alignItems="center"
            >
              <Box
                bg="blue.50"
                p={3}
                borderRadius="xl"
              >
                <Icon
                  as={Feather}
                  name="bell"
                  size={6}
                  color="blue.500"
                />
              </Box>
              <VStack>
                <Heading size="lg" color="gray.800">
                  Notifikasi
                </Heading>
                <Text color="gray.500" fontSize="sm">
                  Riwayat aktivitas pengguna
                </Text>
              </VStack>
            </HStack>
          </Box>

          {/* Today's Notifications */}
          <VStack space={2}>
            <HStack px={2} alignItems="center" space={2}>
              <Icon
                as={Feather}
                name="clock"
                size={4}
                color="gray.500"
              />
              <Text fontSize="sm" fontWeight="medium" color="gray.500">
                Aktivitas Terbaru
              </Text>
            </HStack>
            
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <NotificationCard key={index} log={log} />
              ))
            ) : (
              <Box
                bg="white"
                p={6}
                borderRadius="2xl"
                shadow="2"
                borderWidth={1}
                borderColor="gray.100"
                alignItems="center"
              >
                <Icon
                  as={Feather}
                  name="inbox"
                  size={8}
                  color="gray.400"
                  mb={2}
                />
                <Text color="gray.500" fontSize="md">
                  Memuat aktivitas...
                </Text>
              </Box>
            )}
          </VStack>
        </VStack>
      </Box>
    </ScrollView>
  );
};

export default AdminNotifikasi;