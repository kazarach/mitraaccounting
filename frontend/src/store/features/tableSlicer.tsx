import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TableState {
  [tableName: string]: any[]; // Menyimpan banyak tabel berdasarkan nama
}

const initialState: TableState = {
  transaksi: [], // Data transaksi pembelian
  pesanan: [], // Data pesanan
};

export const tableSlice = createSlice({
  name: "table",
  initialState,
  reducers: {
    setTableData: (state, action: PayloadAction<{ tableName: string; data: any[] }>) => {
      state[action.payload.tableName] = action.payload.data;
    },
    addRow: (state, action: PayloadAction<{ tableName: string; row: any }>) => {
      state[action.payload.tableName].push(action.payload.row);
    },
    updateRow: (state, action: PayloadAction<{ tableName: string; index: number; row: any }>) => {
      state[action.payload.tableName][action.payload.index] = action.payload.row;
    },
    deleteRow: (state, action: PayloadAction<{ tableName: string; id: number }>) => {
      state[action.payload.tableName] = state[action.payload.tableName].filter((row) => row.id !== action.payload.id);
    },
  },
});

export const { setTableData, addRow, updateRow, deleteRow } = tableSlice.actions;
export const tableReducer = tableSlice.reducer;
