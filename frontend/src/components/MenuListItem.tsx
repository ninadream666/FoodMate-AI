import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const defaultImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsKKNZeioee-JViVf_SBcbT3rBBvZu4DRFaNV6zHlXtXEjC2CNTIsAmJI7F9lgIkkqvLI7GQ6aPH6dVIVSJYKiHlfzeJz8XvF7xFAKjKqhEaRfTu-NLionE8GH6f18T0nyhqQZK-DJTCPCdctLKhSoQdXHd52-CSkDC81U5LPnZtqdpW9a81FBB9suOIFC2VSfFJpnsmbj7pDYXC2LSYX9H8h_XhM49_8PrKxP1JwsEgNlm_YYWEv_4lAJqN8e8_e-8meysrlbEIft';

interface Props {
    dish: any;
    onAdd: (dish: any) => void;
}

const MenuListItem = ({ dish, onAdd }: Props) => {
    return (
        <View style={styles.container}>
            {/* 左侧图片 */}
            <Image
                source={{ uri: dish.imageUrl || defaultImage }}
                style={styles.image}
            />

            {/* 中间信息 */}
            <View style={styles.info}>
                <Text style={styles.name}>{dish.name}</Text>
                <Text style={styles.desc} numberOfLines={2}>{dish.description}</Text>
                <Text style={styles.price}>¥{dish.price.toFixed(2)}</Text>
            </View>

            {/* 右侧添加按钮 */}
            <TouchableOpacity style={styles.addButton} onPress={() => onAdd(dish)}>
                <Text style={styles.addText}>+</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#eee',
    },
    info: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    desc: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#e85a2d',
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e85a2d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addText: {
        color: '#fff',
        fontSize: 24,
        lineHeight: 26,
        marginTop: -2,
    },
});

export default MenuListItem;