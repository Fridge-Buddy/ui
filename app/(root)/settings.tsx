import { View, Pressable, Text, StyleSheet } from "react-native";
import { useUser } from "../../contexts/UserContext";
import { Redirect, useRouter } from "expo-router";
import RightIcon from "../../assets/icons/RightIcon";

export default function Settings() {
    const {user} = useUser();
    const router = useRouter();
    return (
        user.isLoggedIn ? (
            <View style={styles.page}>
                <Text style={styles.title}>Settings</Text>

                <View style={{height: 2, width: "100%", backgroundColor: "lightgray"}}></View>

                <Pressable 
                    onPress={() => router.push("/")}
                    style={({pressed}) => [{backgroundColor: pressed ? 'lightgray' : 'transparent' }, styles.settingWrapper,]}
                >
                    <Text>Account Info</Text>
                    <View style={styles.icon}><RightIcon fill="black"/></View>
                </Pressable>
            </View>
        ) : (
            <Redirect href="/" />
        )
    )
}

const styles = StyleSheet.create({
    page: {
        // justifyContent: "center",
        alignItems: "center",
        padding: 40,
        rowGap: 10,
    },
    title: {
        fontSize: 24,
    },
    settingWrapper: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 8,
        borderRadius: 8,
    },
    icon: {
        width: 24,
        height: 24,
    }
})