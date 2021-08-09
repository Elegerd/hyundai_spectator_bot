import { CarInfo } from 'src/types/common';

const formatCar = (car: CarInfo) => {
  return `
		Появилась новая машина в шоуруме: ${car.model} ${car.engine} ${car.equipment}\nЦвет: ${car.carColor} Салон: ${car.interiorColor}\nКол-во: ${car.count} шт.\nЦена: ${car.price}\n${car.url}
	`;
};

export default formatCar;
