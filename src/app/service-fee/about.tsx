import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '@/context/ProfileContext';
import Header from '@/view/components/Header';

export default function ServiceFeeAboutScreen() {
  const router = useRouter();
  const { avatarUrl, verificationStatus } = useProfile();

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <Header avatarUrl={avatarUrl} verificationStatus={verificationStatus} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          <Ionicons name="arrow-back" size={18} color="#6B7280" />
          <Text style={{ fontSize: 13, color: '#6B7280' }}>Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 }}>What is the Service Fee?</Text>
        <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 24, lineHeight: 20 }}>
          Understanding how the service fee works and why it matters.
        </Text>

        <View style={{ gap: 20 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Why do we charge a service fee?</Text>
            <Text style={{ fontSize: 13, color: '#374151', lineHeight: 20 }}>
              Pasuyo is a platform that connects people who need errands done with runners who are willing to do them. To keep the platform running smoothly, we need to cover operational costs such as cloud server hosting, database storage, file storage for images and documents, real-time messaging infrastructure, push notification services, and ongoing development and maintenance.
            </Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>How much is the service fee?</Text>
            <Text style={{ fontSize: 13, color: '#374151', lineHeight: 20 }}>
              The service fee is 10% of the errand budget. This is only charged to the runner (the person who accepts and completes the errand) after the errand has been marked as done. The poster of the errand is not charged any service fee.
            </Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>When do I need to pay?</Text>
            <Text style={{ fontSize: 13, color: '#374151', lineHeight: 20 }}>
              Service fees accumulate as you complete errands. You are not required to pay after every single errand — instead, fees build up and you can pay them in bulk whenever you choose. However, there are limits to how much unpaid service fee you can accumulate before being restricted from accepting new errands.
            </Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>What are the limits?</Text>
            <Text style={{ fontSize: 13, color: '#374151', lineHeight: 20 }}>
              Non-verified users can accumulate up to ₱1,000 in unpaid service fees. Verified users have a higher limit of ₱5,000. Once you reach your limit, you will not be able to accept new errands until you pay your outstanding balance. This ensures fairness and sustainability for the platform.
            </Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>How do I pay?</Text>
            <Text style={{ fontSize: 13, color: '#374151', lineHeight: 20 }}>
              Payment is done via GCash. From the Service Fee page, tap the "Pay Service Fee" button. You will be shown the exact amount to send, the GCash number, and the account name. After sending the payment, enter the reference number and upload a screenshot of the confirmation. An admin will review and verify your payment.
            </Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>What happens after I submit?</Text>
            <Text style={{ fontSize: 13, color: '#374151', lineHeight: 20 }}>
              Your payment will be marked as "Pending" while an admin reviews it. Once verified, it will be marked as "Approved" and your unpaid balance will be reduced accordingly. If there is an issue with your payment (wrong amount, invalid screenshot, etc.), it will be marked as "Rejected" with a note explaining why. You can then submit a new payment.
            </Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Where does the money go?</Text>
            <Text style={{ fontSize: 13, color: '#374151', lineHeight: 20 }}>
              Every peso collected goes directly toward keeping Pasuyo alive and improving the experience for everyone. This includes paying for cloud computing services (servers that run 24/7), database hosting for storing errands, messages, and user data, file storage for profile pictures, errand images, and payment receipts, real-time infrastructure for live chat and notifications, domain and SSL certificates for security, and future development of new features and improvements.
            </Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Is this mandatory?</Text>
            <Text style={{ fontSize: 13, color: '#374151', lineHeight: 20 }}>
              Yes. The service fee is a requirement for all runners who complete errands on the platform. Without it, we would not be able to sustain the infrastructure needed to provide a reliable and secure service. We keep the fee as low as possible (10%) to ensure runners still earn the majority of their earnings.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
