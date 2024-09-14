import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Image,
  Button,
  ButtonText,
  Input,
  InputField,
  Pressable,
} from '@gluestack-ui/themed';
import {FC, useState} from 'react';
import fontStyles from '../../../core/styles/fonts';
import Logo from '../../../assets/images/prapa_logo.png';
import Footer from '../../../components/footer';
import Header from '../../../components/header';
import {useQueryReportLists} from '../../../query/report';
import DialogAndroid from 'react-native-dialogs';
import {launchImageLibrary} from 'react-native-image-picker';
import {PERMISSIONS, RESULTS, request} from 'react-native-permissions';
import {Platform} from 'react-native';
import Toast from 'react-native-toast-message';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faXmark} from '@fortawesome/free-solid-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import appConfig from '../../../../app.json';

const ReportScreen: FC = () => {
  const reportLists = useQueryReportLists();
  const [getSelectTypeComplain, setSelectTypeComplain] = useState('');
  const [getMeterField, setMeterField] = useState('');
  const [getTelField, setTelField] = useState('');
  const [getDetailField, setDetailField] = useState('');
  const [getImages, setImages] = useState([]);
  const [getWatchingImage, setWatchingImage] = useState('');

  const handleTypeMeterField = (text: string) => {
    setMeterField(text);
  };

  const handleTypeTelField = (text: string) => {
    setTelField(text);
  };

  const handleTypeDetailField = (text: string) => {
    setDetailField(text);
  };

  const handleSelectTypeList = async () => {
    const newArray = reportLists.data.map((item: any) => ({
      id: item.ID,
      label: item.COMPLAIN_DESC,
    }));

    const {selectedItem} = await DialogAndroid.showPicker(
      'ตัวเลือกการแจ้งเหตุ',
      null,
      {
        positiveText: 'ปิด',
        items: newArray,
      },
    );

    if (selectedItem) {
      setSelectTypeComplain(selectedItem.label);
    }
  };

  const requestLibraryPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const result = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);

        if (result !== RESULTS.GRANTED) {
          return false;
        }
        return true;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleSelectImageFromlibrary = async () => {
    const requestPermissionStatus = await requestLibraryPermission();
    if (!requestPermissionStatus) {
      return Toast.show({
        type: 'error',
        text1: 'เกิดข้อผิดพลาด',
        text2: 'ไม่สามารถเข้าถึงคลังรูปภาพของคุณได้',
      });
    }

    const options: any = {
      mediaType: 'photo',
      quality: 1,
      includeBase64: false,
      selectionLimit: 4,
    };

    launchImageLibrary(options, async (response: any) => {
      if (response.error) {
        return Toast.show({
          type: 'error',
          text1: 'เกิดข้อผิดพลาด',
          text2: 'ไม่สามารถเลือกรูปภาพได้, ลองใหม่อีกครั้ง',
        });
      } else {
        setImages(response.assets);
      }
    });
  };

  const resetVars = () => {
    setSelectTypeComplain('');
    setMeterField('');
    setTelField('');
    setDetailField('');
    setImages([]);
    setWatchingImage('');
  };

  const handleAddInsertReport = async () => {
    const userId = await AsyncStorage.getItem('userId');
    const formData = new FormData();
    formData.append('memberID', Number(userId));
    formData.append('complainTitle', getSelectTypeComplain);
    formData.append('complainName', getMeterField);
    formData.append('complainDetail', getDetailField);
    formData.append('complainTel', getTelField);

    if (getImages.length > 0) {
      getImages.forEach((item: any, idx: number) => {
        formData.append(`photos_upload${idx}`, {
          uri: item.uri,
          name: item.fileName,
          type: item.type,
        });
      });
    }

    await insertReport(formData);
  };

  const insertReport = async (formData: any) => {
    await axios
      .post(`${appConfig.apiUrl}/insertuseralert.php`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(response => {
        if (Number(response.data.status) === 1) {
          Toast.show({
            type: 'success',
            text1: 'สำเร็จ',
            text2: response.data.message,
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'เกิดข้อผิดพลาด',
            text2: response.data.message,
          });
        }

        resetVars();
      });
  };

  return (
    <>
      <SafeAreaView flex={1} backgroundColor="#3DA1FF">
        <Header title={'แจ้งเหตุ'} />
        <ScrollView keyboardShouldPersistTaps="handled">
          <View
            width={'100%'}
            height={'100%'}
            paddingBottom={14}
            alignItems="center"
            marginTop={16}>
            <View width={'90%'}>
              <View alignItems="center" marginTop={10}>
                <Image
                  source={Logo}
                  style={{
                    width: 120,
                    height: 120,
                  }}
                  alt="Logo"
                />
                <Text
                  fontFamily={fontStyles.semibold}
                  color="white"
                  textAlign="center"
                  marginTop={14}
                  fontSize={21}>
                  รับเรื่องราวร้องทุกข์{'\n'} เทศบาลตำบลน้ำสะอาด
                </Text>
              </View>
              <View
                marginTop={16}
                backgroundColor="#B7DCFF"
                borderRadius={8}
                padding={15}>
                <View marginBottom={10}>
                  <Text fontFamily={fontStyles.medium} color="#065B94">
                    เลือกหัวข้อ
                  </Text>
                  <View marginTop={5}>
                    <Button
                      onPress={handleSelectTypeList}
                      backgroundColor="white"
                      borderWidth={2}
                      borderColor="#D6EBFF"
                      borderRadius={50}
                      size="md">
                      <ButtonText
                        fontFamily={fontStyles.regular}
                        fontSize={14}
                        textAlign="center"
                        color={
                          getSelectTypeComplain === '' ? '#D4D8DB' : 'black'
                        }
                        padding={4}>
                        {(getSelectTypeComplain === '' && <>-เลือก-</>) || (
                          <>{getSelectTypeComplain}</>
                        )}
                      </ButtonText>
                    </Button>
                  </View>
                </View>
                <View marginBottom={10}>
                  <Text fontFamily={fontStyles.medium} color="#065B94">
                    ชื่อ - สกุล *
                  </Text>
                  <View marginTop={5}>
                    <Input
                      backgroundColor="white"
                      variant="rounded"
                      borderWidth={2}
                      borderColor="#D6EBFF"
                      size="md">
                      <InputField
                        value={getMeterField}
                        onChangeText={handleTypeMeterField}
                        fontFamily={fontStyles.regular}
                        fontSize={14}
                        textAlign="center"
                        color="black"
                        placeholderTextColor={'#D4D8DB'}
                        padding={4}
                        placeholder="ชื่อ - สกุล"
                      />
                    </Input>
                  </View>
                </View>
                <View marginBottom={10}>
                  <Text fontFamily={fontStyles.medium} color="#065B94">
                    เบอร์โทรศัพท์ *
                  </Text>
                  <View marginTop={5}>
                    <Input
                      backgroundColor="white"
                      variant="rounded"
                      borderWidth={2}
                      borderColor="#D6EBFF"
                      size="md">
                      <InputField
                        value={getTelField}
                        onChangeText={handleTypeTelField}
                        fontFamily={fontStyles.regular}
                        fontSize={14}
                        textAlign="center"
                        color="black"
                        placeholderTextColor={'#D4D8DB'}
                        padding={4}
                        placeholder="เบอร์โทรศัพท์"
                      />
                    </Input>
                  </View>
                </View>
                <View marginBottom={10}>
                  <Text fontFamily={fontStyles.medium} color="#065B94">
                    รายละเอียด *
                  </Text>
                  <View marginTop={5}>
                    <Input
                      backgroundColor="white"
                      borderRadius={16}
                      borderWidth={2}
                      borderColor="#D6EBFF"
                      size="md"
                      height={120}>
                      <InputField
                        value={getDetailField}
                        onChangeText={handleTypeDetailField}
                        placeholder="สถานที่และรายละเอียดอื่นๆเพิ่มเติม"
                        padding={10}
                        textAlignVertical="top"
                        placeholderTextColor={'#D4D8DB'}
                        fontFamily={fontStyles.regular}
                        numberOfLines={4}
                        multiline
                      />
                    </Input>
                  </View>
                </View>
                <View marginBottom={10}>
                  <Text fontFamily={fontStyles.medium} color="#065B94">
                    รูปภาพประกอบ *
                  </Text>
                  <View marginTop={5}>
                    <Button
                      onPress={handleSelectImageFromlibrary}
                      borderRadius={20}
                      marginTop={12}
                      size="md"
                      width={'100%'}
                      backgroundColor="#054977">
                      <ButtonText fontFamily={fontStyles.semibold}>
                        อัปโหลดรูปภาพ
                      </ButtonText>
                    </Button>
                  </View>
                </View>
                {getImages.length > 0 && (
                  <View
                    marginTop={2}
                    marginBottom={4}
                    flexDirection="row"
                    justifyContent="center"
                    alignItems="center"
                    gap={20}
                    flexWrap="wrap">
                    {getImages.map((item: any, idx: number) => {
                      return (
                        <Pressable
                          key={idx}
                          onPress={() => {
                            setWatchingImage(item.uri);
                          }}>
                          <Image
                            width={100}
                            height={100}
                            source={{uri: item.uri}}
                            alt="image"
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                )}
                <View marginTop={2}>
                  <Text
                    textAlign="center"
                    fontFamily={fontStyles.semibold}
                    color="#F74C4C"
                    fontSize={15}>
                    *แนบรูปภาพอย่างน้อย 1 รูป และสูงสุดไม่เกิน 4 รูป
                  </Text>
                </View>
                <View marginTop={20}>
                  <Button
                    onPress={handleAddInsertReport}
                    borderRadius={20}
                    marginTop={12}
                    size="md"
                    width={'100%'}
                    backgroundColor="#054977">
                    <ButtonText fontFamily={fontStyles.semibold}>
                      ยืนยันส่งข้อมูล
                    </ButtonText>
                  </Button>
                </View>
              </View>
            </View>
            <Footer />
          </View>
        </ScrollView>
      </SafeAreaView>
      {getWatchingImage !== '' && (
        <View
          position="absolute"
          top={0}
          left={0}
          zIndex={5}
          width={'$full'}
          height={'$full'}
          backgroundColor="rgba(0,0,0,0.8)"
          justifyContent="center"
          alignItems="center"
          padding={4}>
          <Pressable
            onPress={() => {
              setWatchingImage('');
            }}
            position="absolute"
            top={10}
            right={10}>
            <FontAwesomeIcon icon={faXmark} color="white" size={30} />
          </Pressable>
          <Image
            source={{uri: getWatchingImage}}
            style={{width: '90%', height: '90%'}}
            borderRadius={10}
            resizeMode="cover"
            alt="fullImage"
          />
        </View>
      )}
    </>
  );
};

export default ReportScreen;
