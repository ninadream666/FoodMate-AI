import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
    item: any;
    onUpdate: (id: number, quantity: number) => void;
}

const CartItem = ({ item, onUpdate }: Props) => {
    return (
        <View style={styles.container}>
            <Image source={{ uri: item.imageUrl || item.image }} style={styles.image} />

            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.price}>¥{item.price.toFixed(2)}</Text>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.btn}
                    onPress={() => onUpdate(item.id, item.quantity - 1)}
                >
                    <Text style={styles.btnText}>-</Text>
                </TouchableOpacity>

                <Text style={styles.quantity}>{item.quantity}</Text>

                <TouchableOpacity
                    style={styles.btn}
                    onPress={() => onUpdate(item.id, item.quantity + 1)}
                >
                    <Text style={styles.btnText}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
        alignItems: 'center',
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#eee',
    },
    info: {
        flex: 1,
        marginLeft: 12,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    price: {
        fontSize: 14,
        color: '#e85a2d',
        marginTop: 4,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    btn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 18,
    },
    quantity: {
        marginHorizontal: 12,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CartItem;