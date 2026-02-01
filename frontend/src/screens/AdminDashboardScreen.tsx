import React from 'react';
import { View, Text, Button } from 'react-native';
import { authService } from '../services/authService';

const AdminDashboardScreen = ({ navigation }: any) => {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 24 }}>系统管理员后台</Text>
            <Button title="退出" onPress={() => { authService.logout(); navigation.replace('Login'); }} />
        </View>
    );
};
export default AdminDashboardScreen;