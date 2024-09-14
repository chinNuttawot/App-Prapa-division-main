import {Platform, Alert, Linking, PermissionsAndroid} from 'react-native';
import Geolocation from 'react-native-geolocation-service';

export const getCurrentLocation = () =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        const cords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position?.coords?.heading,
        };
        resolve(cords);
      },
      error => {
        reject(error.message);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  });

export const watchLocation = (onSuccess: any, onError: any) => {
  return Geolocation.watchPosition(
    position => {
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        heading: position?.coords?.heading,
      };
      onSuccess(coords);
    },
    error => {
      onError(error.message);
    },
    {enableHighAccuracy: true, distanceFilter: 10},
  );
};

export const reqLocationPermission = () =>
  new Promise(async (reslove, reject) => {
    try {
      return PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ).then(granted => {
        if (granted === 'granted') {
          return reslove(true);
        } else {
          Alert.alert(
            'ไม่ได้รับอนุญาต',
            'คุณจำเป็นจะต้องเปิดการติดตามตำแหน่ง เพื่อทำให้แอปพลิชั่นสามารถติดตามตำแหน่งของคุณได้',
            [
              {text: 'ปิด'},
              {
                text: 'ตั้งค่า',
                onPress: () => {
                  Linking.openSettings();
                },
              },
            ],
          );
          return reject(false);
        }
      });
    } catch (err) {
      return reject(false);
    }
  });
