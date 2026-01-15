import * as React from "react";
import {
  Html,
  Body,
  Container,
  Section,
  Img,
  Text,
  Hr,
  Tailwind,
} from "@react-email/components";

export interface SampleRequestEmailProps {
  companyName: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  sector: string;
  productionGroup: string;
  products: string;
  date: string;
}

export default function SampleRequestEmail(props: SampleRequestEmailProps) {
  const {
    companyName,
    fullName,
    email,
    phone,
    address,
    sector,
    productionGroup,
    products,
    date,
  } = props;

  return (
    <Html>
      <Tailwind>
        <Body className="bg-gray-100 font-sans text-gray-800 p-6">
          <Container className="bg-white max-w-xl mx-auto rounded-xl shadow-md p-8">
            {/* Logo */}
            <Section className="text-center mb-6">
              <Img
                /* src="/ceyhunlar.png" */
                src="https://ceyhunlarplastik.com.tr/assets/img/logo-2093.png"
                alt="Ceyhunlar Logo"
                width="150"
                className="mx-auto"
              />
            </Section>

            {/* Title */}
            <Section className="text-center mb-4">
              <Text className="text-2xl font-semibold text-gray-900">
                Numune Talebiniz Alınmıştır
              </Text>
              <Text className="text-sm text-gray-600 mt-2">
                En kısa sürede sizinle iletişime geçilecektir.
              </Text>
            </Section>

            <Hr className="border-gray-300 my-6" />

            {/* Preview Section */}
            <Section>
              <Text className="text-lg font-semibold text-gray-800 mb-3">
                📄 Form Bilgileri (Önizleme)
              </Text>

              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr>
                    <td className="py-2 font-bold">Firma Adı:</td>
                    <td className="py-2">{companyName}</td>
                  </tr>

                  <tr className="bg-gray-50">
                    <td className="py-2 font-bold">İsim Soyisim:</td>
                    <td className="py-2">{fullName}</td>
                  </tr>

                  <tr>
                    <td className="py-2 font-bold">Email:</td>
                    <td className="py-2">{email}</td>
                  </tr>

                  <tr className="bg-gray-50">
                    <td className="py-2 font-bold">Telefon:</td>
                    <td className="py-2">{phone}</td>
                  </tr>

                  <tr>
                    <td className="py-2 font-bold">Adres:</td>
                    <td className="py-2">{address}</td>
                  </tr>

                  <tr className="bg-gray-50">
                    <td className="py-2 font-bold">Sektör:</td>
                    <td className="py-2">{sector}</td>
                  </tr>

                  <tr>
                    <td className="py-2 font-bold">Üretim Grubu:</td>
                    <td className="py-2">{productionGroup}</td>
                  </tr>

                  <tr className="bg-gray-50">
                    <td className="py-2 font-bold">Ürünler:</td>
                    <td className="py-2">{products}</td>
                  </tr>

                  <tr>
                    <td className="py-2 font-bold">Tarih:</td>
                    <td className="py-2">{date}</td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Hr className="border-gray-300 my-6" />

            <Section className="text-center">
              <Text className="text-xs text-gray-500">
                Bu e-posta otomatik olarak oluşturulmuştur. Lütfen
                yanıtlamayınız.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
