interface LocArea { name: string }
interface LocCity { name: string; areas: LocArea[] }
interface LocCountry { name: string; cities: LocCity[] }

export const countries: LocCountry[] = [
  {
    name: 'Bangladesh',
    cities: [
      {
        name: 'Dhaka',
        areas: [
          { name: 'Gulshan' },
          { name: 'Banani' },
          { name: 'Dhanmondi' },
          { name: 'Uttara' },
          { name: 'Mirpur' },
          { name: 'Mohammadpur' },
          { name: 'Tejgaon' },
          { name: 'Bashundhara' },
          { name: 'Badda' },
          { name: 'Rampura' },
          { name: 'Motijheel' },
          { name: 'Paltan' },
          { name: 'Shahbag' },
          { name: 'Lalbagh' },
          { name: 'Wari' },
          { name: 'Khilgaon' },
          { name: 'Mugda' },
          { name: 'Jatrabari' },
          { name: 'Shyamoli' },
          { name: 'Adabor' },
          { name: 'Cantonment' },
          { name: 'Kafrul' },
          { name: 'Pallabi' },
          { name: 'Turag' },
          { name: 'Keraniganj' },
          { name: 'Savar' },
          { name: 'Tongi' },
          { name: 'Gazipur' },
          { name: 'Narayanganj' },
        ],
      },
      {
        name: 'Chattogram',
        areas: [
          { name: 'Agrabad' },
          { name: 'Nasirabad' },
          { name: 'GEC Circle' },
          { name: 'Halishahar' },
          { name: 'Pahartali' },
          { name: 'Patenga' },
          { name: 'Kotwali' },
          { name: 'Bayezid' },
          { name: 'Chandgaon' },
          { name: 'Bakalia' },
          { name: 'Khulshi' },
          { name: 'Oxygen' },
        ],
      },
      {
        name: 'Sylhet',
        areas: [
          { name: 'Zindabazar' },
          { name: 'Amberkhana' },
          { name: 'Subid Bazar' },
          { name: 'Tilagarh' },
          { name: 'Shibganj' },
          { name: 'Kumarpara' },
          { name: 'Upashahar' },
          { name: 'Pathantula' },
        ],
      },
      {
        name: 'Khulna',
        areas: [
          { name: 'Sonadanga' },
          { name: 'Boyra' },
          { name: 'Khalishpur' },
          { name: 'Daulatpur' },
          { name: 'Shibbari' },
          { name: 'Khan Jahan Ali' },
        ],
      },
      {
        name: 'Rajshahi',
        areas: [
          { name: 'Shaheb Bazar' },
          { name: 'New Market' },
          { name: 'Uposhohor' },
          { name: 'Laxmipur' },
          { name: 'Kazla' },
          { name: 'Sapura' },
        ],
      },
      {
        name: 'Rangpur',
        areas: [
          { name: 'Dhap' },
          { name: 'Jahaj Company' },
          { name: 'Modern' },
          { name: 'Lalbagh' },
        ],
      },
      {
        name: 'Barishal',
        areas: [
          { name: 'Sadar Road' },
          { name: 'Nathullabad' },
          { name: 'Band Road' },
          { name: 'Rupatali' },
        ],
      },
      {
        name: 'Comilla',
        areas: [
          { name: 'Kandirpar' },
          { name: 'Tomsom Bridge' },
          { name: 'Laksam' },
          { name: 'Nangalkot' },
        ],
      },
    ],
  },
  {
    name: 'India',
    cities: [
      {
        name: 'Mumbai',
        areas: [
          { name: 'Andheri' },
          { name: 'Bandra' },
          { name: 'Juhu' },
          { name: 'Dadar' },
          { name: 'Powai' },
          { name: 'Malad' },
          { name: 'Goregaon' },
          { name: 'Borivali' },
          { name: 'Thane' },
          { name: 'Navi Mumbai' },
        ],
      },
      {
        name: 'Delhi',
        areas: [
          { name: 'Connaught Place' },
          { name: 'Karol Bagh' },
          { name: 'Dwarka' },
          { name: 'Rohini' },
          { name: 'Lajpat Nagar' },
          { name: 'Saket' },
          { name: 'Vasant Kunj' },
          { name: 'Greater Kailash' },
          { name: 'Janakpuri' },
          { name: 'Pitampura' },
        ],
      },
      {
        name: 'Bangalore',
        areas: [
          { name: 'Koramangala' },
          { name: 'Indiranagar' },
          { name: 'Whitefield' },
          { name: 'HSR Layout' },
          { name: 'Electronic City' },
          { name: 'Jayanagar' },
          { name: 'Marathahalli' },
          { name: 'JP Nagar' },
        ],
      },
      {
        name: 'Kolkata',
        areas: [
          { name: 'Salt Lake' },
          { name: 'New Town' },
          { name: 'Park Street' },
          { name: 'Ballygunge' },
          { name: 'Jadavpur' },
          { name: 'Howrah' },
          { name: 'Dum Dum' },
          { name: 'Garia' },
        ],
      },
      {
        name: 'Chennai',
        areas: [
          { name: 'T. Nagar' },
          { name: 'Anna Nagar' },
          { name: 'Adyar' },
          { name: 'Velachery' },
          { name: 'Tambaram' },
          { name: 'OMR' },
          { name: 'Porur' },
        ],
      },
      {
        name: 'Hyderabad',
        areas: [
          { name: 'Banjara Hills' },
          { name: 'Jubilee Hills' },
          { name: 'Madhapur' },
          { name: 'Gachibowli' },
          { name: 'Kondapur' },
          { name: 'Secunderabad' },
          { name: 'Kukatpally' },
        ],
      },
    ],
  },
  {
    name: 'Pakistan',
    cities: [
      {
        name: 'Karachi',
        areas: [
          { name: 'Clifton' },
          { name: 'DHA' },
          { name: 'Gulshan-e-Iqbal' },
          { name: 'North Nazimabad' },
          { name: 'Saddar' },
          { name: 'Gulistan-e-Jauhar' },
          { name: 'Korangi' },
          { name: 'PECHS' },
          { name: 'Bahria Town' },
        ],
      },
      {
        name: 'Lahore',
        areas: [
          { name: 'Gulberg' },
          { name: 'DHA' },
          { name: 'Model Town' },
          { name: 'Johar Town' },
          { name: 'Bahria Town' },
          { name: 'Garden Town' },
          { name: 'Cantt' },
          { name: 'Iqbal Town' },
        ],
      },
      {
        name: 'Islamabad',
        areas: [
          { name: 'F-6' },
          { name: 'F-7' },
          { name: 'F-8' },
          { name: 'F-10' },
          { name: 'G-9' },
          { name: 'G-10' },
          { name: 'G-11' },
          { name: 'I-8' },
          { name: 'E-11' },
          { name: 'Bahria Town' },
          { name: 'DHA' },
        ],
      },
      {
        name: 'Rawalpindi',
        areas: [
          { name: 'Satellite Town' },
          { name: 'Saddar' },
          { name: 'Chaklala' },
          { name: 'Westridge' },
          { name: 'Bahria Town' },
        ],
      },
      {
        name: 'Peshawar',
        areas: [
          { name: 'University Town' },
          { name: 'Hayatabad' },
          { name: 'Saddar' },
          { name: 'Cantt' },
        ],
      },
    ],
  },
];

export function getCitiesForCountry(country: string) {
  const found = countries.find((c) => c.name === country);
  return found?.cities || [];
}

export function getAreasForCity(country: string, city: string) {
  const cities = getCitiesForCountry(country);
  const found = cities.find((c) => c.name === city);
  return found?.areas || [];
}

export function getCurrency(country: string): string {
  switch (country) {
    case 'Bangladesh': return '৳';
    case 'India': return '₹';
    case 'Pakistan': return 'Rs';
    default: return '৳';
  }
}

