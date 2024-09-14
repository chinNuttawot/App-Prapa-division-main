import {FC, useEffect, useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Pressable,
  Input,
  InputField,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import fontStyles from '../../../core/styles/fonts';
import SVG from '../../../constants/svgs';
import MeterCard from '../../../components/meter_card';
import Footer from '../../../components/footer';
import Header from '../../../components/header';
import {
  useMutationSavePayment,
  useQueryMember,
  useQueryMemberBillHistorys,
  useQueryMemberHistoryId,
  useQueryBillHistoryReceive,
  usePaymentWithScan,
} from '../../../query/payment';
import {useQueryMeterMember} from '../../../query/meter';
import {useQueryClient} from '@tanstack/react-query';
import {TouchableHighlight} from 'react-native';
import Toast from 'react-native-toast-message';
import {BLEPrinter} from 'react-native-thermal-receipt-printer-image-qr';

const PaymentScreen: FC = () => {
  const queryClient = useQueryClient();
  const [getMemberLists, setMemberLists] = useState([]);
  const [getSelectMemberId, setSelectMemberId] = useState(0);
  const [getMemberSelect, setMemberSelect]: any = useState({});
  const [getSelectHistoryId, setSelectHistoryId] = useState(-1);
  const [getSelectHistoryData, setSelectHistoryData]: any = useState({});
  const [getPaymentAmountConfirm, setPaymentAmountConfirm] = useState(0);

  const [getTextSearch, setTextSearch] = useState('');
  const memberLists = useQueryMember(getTextSearch);
  const meterMember = useQueryMeterMember(getSelectMemberId);
  const memberBillHistorys = useQueryMemberBillHistorys(getSelectMemberId);
  const historyId = useQueryMemberHistoryId(getSelectHistoryId);
  const savePayment = useMutationSavePayment();
  const useBillReceive = useQueryBillHistoryReceive(getSelectHistoryId);
  const [getBillData, setBillData]: any = useState({});
  const useScanQRCode = usePaymentWithScan();

  const handleChangeMemberFilterText = (text: string) => {
    setTextSearch(text);
  };

  useEffect(() => {
    if (memberLists.data) {
      setMemberLists(memberLists.data);
    }

    if (meterMember.data) {
      setMemberSelect(meterMember.data[0] || meterMember.data);
    }

    if (historyId.data) {
      setSelectHistoryData(historyId.data[0] || historyId.data);
    }

    if (useBillReceive.data && getSelectHistoryId !== -1) {
      setBillData(useBillReceive.data);
    }
  }, [
    memberLists.data,
    meterMember.data,
    memberBillHistorys.data,
    historyId.data,
    useBillReceive.data,
  ]);

  const handleSelectMember = async (data: any) => {
    setSelectMemberId(Number(data.MEMBER_ID));
    await queryClient.invalidateQueries({
      queryKey: ['memberMeter', Number(data.MEMBER_ID)],
    });

    await queryClient.invalidateQueries({
      queryKey: ['memberBillHistorys', Number(data.MEMBER_ID)],
    });
  };

  const handleSelectHistory = async (data: any) => {
    setSelectHistoryId(data.historyID);

    await queryClient.invalidateQueries({
      queryKey: ['historyId', Number(data.historyID)],
    });
  };

  const handleChangePaymentAmountConfirm = (text: string) => {
    setPaymentAmountConfirm(Number(text));
  };

  const resetPayment = () => {
    setSelectHistoryId(0);
    setSelectHistoryData({});
    setPaymentAmountConfirm(0);
  };

  const handlePaymentWithCash = async () => {
    if (
      getPaymentAmountConfirm === 0 ||
      Number(getPaymentAmountConfirm) !==
        Number(getSelectHistoryData.paymentAmt)
    ) {
      return Toast.show({
        type: 'error',
        text1: 'เกิดข้อผิดพลาด',
        text2: 'โปรดระบุจำนวนเงินที่ต้องชำระให้ถูกต้อง !!',
      });
    }

    const payload = {
      type: 'C',
      historyID: getSelectHistoryId,
    };

    await savePayment.mutateAsync(payload);
    await queryClient.invalidateQueries({
      queryKey: ['memberBillHistorys', Number(getSelectMemberId)],
    });
    resetPayment();
  };

  const handlePaymentWithTransfer = async () => {
    if (
      getPaymentAmountConfirm === 0 ||
      Number(getPaymentAmountConfirm) !==
        Number(getSelectHistoryData.paymentAmt)
    ) {
      return Toast.show({
        type: 'error',
        text1: 'เกิดข้อผิดพลาด',
        text2: 'โปรดระบุจำนวนเงินที่ต้องชำระให้ถูกต้อง !!',
      });
    }

    if (
      getSelectHistoryData.paymentAmt &&
      getSelectHistoryData.invoiceNo &&
      getMemberSelect.memberName
    ) {
      const payload = {
        customerName: getMemberSelect.memberName,
        total: Number(getSelectHistoryData.paymentAmt),
        referenceNo: getSelectHistoryData.invoiceNo,
      };

      await useScanQRCode.mutateAsync(payload).then(response => {
        console.log(response);
      });
    }
    // resetPayment();
  };

  const handleScanQrCode = async () => {};

  const handlePrintBill = async () => {
    if (getSelectHistoryId !== -1 && Object.keys(getBillData).length > 0) {
      const base64: any = getBillData.image.split('base64,')[1];
      BLEPrinter.printImageBase64(base64, {
        imageWidth: 400,
        imageHeight: 1600,
        paddingX: 0,
      });
    }
  };

  return (
    <SafeAreaView flex={1} backgroundColor="#3DA1FF">
      <Header title={'รับชำระเงิน'} />
      <ScrollView keyboardShouldPersistTaps="handled">
        <View
          width={'100%'}
          height={'100%'}
          paddingBottom={14}
          alignItems="center"
          marginTop={16}>
          <View width={'90%'}>
            <View
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center">
              <Text fontFamily={fontStyles.semibold} color="white">
                ค้นหาสมาชิก
              </Text>
              <Pressable onPress={handleScanQrCode}>
                <SVG.Payment_Icon />
              </Pressable>
            </View>
            <View marginTop={10}>
              <Input
                backgroundColor="white"
                variant="rounded"
                borderWidth={2}
                borderColor="#D6EBFF"
                size="md">
                <InputField
                  onChangeText={handleChangeMemberFilterText}
                  fontFamily={fontStyles.regular}
                  fontSize={14}
                  placeholder="เลขประจำมิเตอร์ / บ้านเลขที่ / หมายเลขโทรศัพท์"
                  placeholderTextColor="#D4D8DB"
                  padding={4}
                />
              </Input>
            </View>
            <MeterCard
              onSelect={handleSelectMember}
              listItems={getMemberLists}
            />
            <View
              marginTop={16}
              backgroundColor="#D6EBFF"
              width={'100%'}
              borderRadius={16}
              paddingHorizontal={20}
              paddingVertical={15}>
              {(Object.keys(getMemberSelect).length > 0 && (
                <>
                  <View
                    width={'80%'}
                    flexDirection="row"
                    justifyContent="flex-start"
                    marginVertical={5}
                    gap={18}>
                    <Text color="#087FCF" fontFamily={fontStyles.semibold}>
                      เลขมิเตอร์ :
                    </Text>
                    <Text
                      color="#087FCF"
                      fontFamily={fontStyles.regular}
                      textBreakStrategy="simple">
                      {getMemberSelect.meterNumber}
                    </Text>
                  </View>
                  <View
                    width={'80%'}
                    flexDirection="row"
                    justifyContent="flex-start"
                    marginVertical={5}
                    gap={18}>
                    <Text color="#087FCF" fontFamily={fontStyles.semibold}>
                      ประเภทผู้ใช้น้ำ :
                    </Text>
                    <Text
                      color="#087FCF"
                      fontFamily={fontStyles.regular}
                      textBreakStrategy="simple">
                      {getMemberSelect.meterType}
                    </Text>
                  </View>
                  <View
                    width={'80%'}
                    flexDirection="row"
                    justifyContent="flex-start"
                    marginVertical={5}
                    gap={18}>
                    <Text color="#087FCF" fontFamily={fontStyles.semibold}>
                      ชื่อผู้ใช้น้ำ :
                    </Text>
                    <Text
                      color="#087FCF"
                      fontFamily={fontStyles.regular}
                      textBreakStrategy="simple">
                      {getMemberSelect.memberName}
                    </Text>
                  </View>
                  <View
                    width={'70%'}
                    flexDirection="row"
                    justifyContent="flex-start"
                    marginVertical={5}
                    gap={18}>
                    <Text color="#087FCF" fontFamily={fontStyles.semibold}>
                      สถานที่ใช้น้ำ :
                    </Text>
                    <Text
                      color="#087FCF"
                      fontFamily={fontStyles.regular}
                      textBreakStrategy="simple">
                      {getMemberSelect.memberAddress}
                    </Text>
                  </View>
                  <View
                    width={'80%'}
                    flexDirection="row"
                    justifyContent="flex-start"
                    marginVertical={5}
                    gap={18}>
                    <Text color="#087FCF" fontFamily={fontStyles.semibold}>
                      เบอร์ติดต่อ :
                    </Text>
                    <Text
                      color="#087FCF"
                      fontFamily={fontStyles.regular}
                      textBreakStrategy="simple">
                      {getMemberSelect.memberTel}
                    </Text>
                  </View>
                  <View marginTop={14}>
                    <View
                      flexDirection="row"
                      gap={2}
                      justifyContent="center"
                      alignItems="center">
                      <Button
                        backgroundColor="#7ABFFF"
                        width={'50%'}
                        borderTopLeftRadius={8}
                        borderBottomLeftRadius={8}
                        borderTopRightRadius={0}
                        borderBottomRightRadius={0}>
                        <ButtonText
                          color="white"
                          fontFamily={fontStyles.semibold}>
                          รอบบิลเดือน
                        </ButtonText>
                      </Button>
                      <Button
                        backgroundColor="#7ABFFF"
                        width={'50%'}
                        borderTopRightRadius={8}
                        borderBottomRightRadius={8}
                        borderTopLeftRadius={0}
                        borderBottomLeftRadius={0}>
                        <ButtonText
                          color="white"
                          fontFamily={fontStyles.semibold}>
                          จำนวนเงิน
                        </ButtonText>
                      </Button>
                    </View>
                  </View>
                  <View marginTop={22}>
                    {memberBillHistorys?.data?.map((item: any, idx: number) => {
                      return (
                        <TouchableHighlight
                          key={idx}
                          underlayColor={'none'}
                          onPress={() => handleSelectHistory(item)}>
                          <View
                            flexDirection="row"
                            justifyContent="space-between"
                            alignItems="center"
                            borderTopWidth={1}
                            borderColor={
                              idx === memberBillHistorys?.data.length - 1
                                ? '#3CACF7'
                                : '#7ABFFF'
                            }
                            paddingVertical={6}
                            borderBottomWidth={
                              idx === memberBillHistorys?.data.length - 1
                                ? 2
                                : 0
                            }>
                            <Text
                              color="#087FCF"
                              fontFamily={fontStyles.regular}>
                              {item.billCycle}
                            </Text>
                            <Text
                              color="#087FCF"
                              fontFamily={fontStyles.regular}>
                              {item.paymentAmt}
                            </Text>
                          </View>
                        </TouchableHighlight>
                      );
                    })}
                  </View>
                </>
              )) || (
                <Text fontFamily={fontStyles.regular} textAlign="center">
                  ไม่มีข้อมูลการค้นหา
                </Text>
              )}
            </View>
            {Object.keys(getSelectHistoryData).length > 0 && (
              <View
                marginTop={16}
                backgroundColor="#D6EBFF"
                width={'100%'}
                borderRadius={16}
                paddingHorizontal={20}
                paddingVertical={20}>
                <Text
                  color="#F74C4C"
                  fontFamily={fontStyles.semibold}
                  textAlign="center">
                  บังคับชำระเงินค่าน้ำ เก่าสุดก่อนเสมอ
                </Text>
                <View marginTop={20}>
                  <View
                    flexDirection="row"
                    justifyContent="flex-start"
                    marginVertical={3}
                    gap={12}
                    alignItems="center">
                    <Text color="#087FCF" fontFamily={fontStyles.semibold}>
                      รอบบิลเดือน:
                    </Text>
                    <Text color="#087FCF" fontFamily={fontStyles.regular}>
                      {getSelectHistoryData.billCycle}
                    </Text>
                  </View>
                  <View
                    flexDirection="row"
                    justifyContent="flex-start"
                    marginVertical={3}
                    gap={12}
                    alignItems="center">
                    <Text color="#087FCF" fontFamily={fontStyles.semibold}>
                      เลขที่ใบแจ้งหนี้ :
                    </Text>
                    <Text color="#087FCF" fontFamily={fontStyles.regular}>
                      {getSelectHistoryData.invoiceNo}
                    </Text>
                  </View>
                  <View
                    flexDirection="row"
                    justifyContent="flex-start"
                    marginVertical={3}
                    gap={12}
                    alignItems="center">
                    <Text color="#087FCF" fontFamily={fontStyles.semibold}>
                      จำนวนเงินที่ต้องชำระ :
                    </Text>
                    <Text color="#087FCF" fontFamily={fontStyles.regular}>
                      {getSelectHistoryData.paymentAmt} บาท
                    </Text>
                  </View>
                  <View
                    flexDirection="row"
                    justifyContent="flex-start"
                    marginVertical={3}
                    gap={12}
                    alignItems="center">
                    <Text color="#087FCF" fontFamily={fontStyles.semibold}>
                      ครบกำหนดชำระ :
                    </Text>
                    <Text color="#087FCF" fontFamily={fontStyles.regular}>
                      {getSelectHistoryData.paymentDueDate}
                    </Text>
                  </View>
                </View>
                <View marginTop={22}>
                  <Input
                    backgroundColor="white"
                    borderWidth={0}
                    size="md"
                    borderRadius={20}>
                    <InputField
                      onChangeText={handleChangePaymentAmountConfirm}
                      keyboardType="decimal-pad"
                      placeholder="ระบุจำนวนที่ต้องการชำระ"
                      placeholderTextColor="#D4D8DB"
                      paddingVertical={3}
                      paddingHorizontal={16}
                      fontFamily={fontStyles.regular}
                    />
                  </Input>
                </View>
                <View marginTop={20} alignItems="center">
                  <Button
                    onPress={handlePaymentWithCash}
                    borderRadius={20}
                    size="md"
                    width={'100%'}
                    backgroundColor="#087FCF">
                    <ButtonText fontFamily={fontStyles.semibold}>
                      ชำระด้วยเงินสด
                    </ButtonText>
                  </Button>
                  <Button
                    onPress={handlePaymentWithTransfer}
                    borderRadius={20}
                    marginTop={12}
                    size="md"
                    width={'100%'}
                    backgroundColor="#054977">
                    <ButtonText fontFamily={fontStyles.semibold}>
                      โอนเงินชำระ
                    </ButtonText>
                  </Button>
                  <Button
                    borderRadius={20}
                    onPress={handlePrintBill}
                    marginTop={12}
                    size="md"
                    width={'100%'}
                    backgroundColor="#043759">
                    <ButtonText fontFamily={fontStyles.semibold}>
                      พิมพ์ใบเสร็จ (ชั่วคราว)
                    </ButtonText>
                  </Button>
                </View>
              </View>
            )}
          </View>
          <Footer />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PaymentScreen;
