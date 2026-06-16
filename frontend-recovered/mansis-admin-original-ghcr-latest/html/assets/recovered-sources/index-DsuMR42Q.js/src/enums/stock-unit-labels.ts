import { StockUnit } from '@/types/stock';

export const StockUnitLabels: Record<StockUnit, string> = {
  [StockUnit.PIECE]: 'stock.unit.piece',
  [StockUnit.KG]: 'stock.unit.kg',
  [StockUnit.GRAM]: 'stock.unit.gram',
  [StockUnit.LITER]: 'stock.unit.liter',
  [StockUnit.ML]: 'stock.unit.ml',
  [StockUnit.PORTION]: 'stock.unit.portion'
};
