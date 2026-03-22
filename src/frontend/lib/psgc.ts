const PSGC_BASE_URL = 'https://psgc.gitlab.io/api';

export interface Province {
  code: string;
  name: string;
}

export interface City {
  code: string;
  name: string;
}

export interface Barangay {
  code: string;
  name: string;
}

export const fetchProvinces = async (): Promise<Province[]> => {
  const response = await fetch(`${PSGC_BASE_URL}/provinces`);
  const data = await response.json();
  return data.sort((a: Province, b: Province) => a.name.localeCompare(b.name));
};

export const fetchCities = async (provinceCode: string): Promise<City[]> => {
  const response = await fetch(`${PSGC_BASE_URL}/provinces/${provinceCode}/cities-municipalities`);
  const data = await response.json();
  return data.sort((a: City, b: City) => a.name.localeCompare(b.name));
};

export const fetchBarangays = async (cityCode: string): Promise<Barangay[]> => {
  const response = await fetch(`${PSGC_BASE_URL}/cities-municipalities/${cityCode}/barangays`);
  const data = await response.json();
  return data.sort((a: Barangay, b: Barangay) => a.name.localeCompare(b.name));
};
