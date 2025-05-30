import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TableState {
  [tableName: string]: any[];
}

const initialState: TableState = {
  transaksi: [],
  pesanan: [],
  return: [], 
  s_transaksi: [], 
  s_pesanan: [], 
  s_return: [], 
  s_poin: [], 
  opname: [], 
};

export const tableSlice = createSlice({
  name: "table",
  initialState,
  reducers: {
    setTableData: (state, action: PayloadAction<{ tableName: string; data: any[] }>) => {
      state[action.payload.tableName] = action.payload.data;
    },
    addRow: (state, action: PayloadAction<{ tableName: string; row: any }>) => {
      const table = state[action.payload.tableName];
      const rowToAdd = action.payload.row;
    
      const existingRowIndex = table.findIndex((row) => row.stock_code === rowToAdd.stock_code);
    
      if (existingRowIndex !== -1) {
        table[existingRowIndex].quantity += rowToAdd.quantity;
      } else {
        const nextId = table.length > 0
          ? Math.max(...table.map((row) => row.id ?? 0)) + 1
          : 0;
    
          const rowWithId = {
            ...rowToAdd,
            id: rowToAdd.stock ?? rowToAdd.id ?? nextId, // ✅ prioritas dari field `stock`
          };          
    
        table.push(rowWithId);
      }
    },
    
    updateRow: (state, action: PayloadAction<{ tableName: string; index: number; row: any }>) => {
      state[action.payload.tableName][action.payload.index] = action.payload.row;
    },
    deleteRow: (state, action: PayloadAction<{ tableName: string; id: number }>) => {
      state[action.payload.tableName] = state[action.payload.tableName].filter((row) => row.id !== action.payload.id);
    },
    clearTable: (state, action: PayloadAction<{ tableName: string }>) => {
      state[action.payload.tableName] = [];
    },
  },
});

export const { setTableData, addRow, updateRow, deleteRow,clearTable } = tableSlice.actions;
export const tableReducer = tableSlice.reducer;
