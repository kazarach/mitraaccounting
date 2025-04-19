import React from 'react'
import SyncLoader from  "react-spinners/SyncLoader";

const loading = () => {
  return (
    <div className="flex justify-center items-center min-h-screen">
    <SyncLoader color="#366cd6" />
  </div>
  )
}

export default loading
