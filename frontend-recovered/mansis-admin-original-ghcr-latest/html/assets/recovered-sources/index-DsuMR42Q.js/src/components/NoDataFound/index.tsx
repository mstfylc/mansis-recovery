import React from 'react';
import { Box, TableCell, TableRow, Typography } from '@mui/material';

interface NoDataFoundProps {
  message: string;
  colSpan?: number;
}

const NoDataFound: React.FC<NoDataFoundProps> = ({ message, colSpan = 7 }) => {
  return (
    <TableRow className="no-data-row">
      <TableCell colSpan={colSpan}>
        <Box p={2}>
          <Typography variant="h6" color="text.secondary" align="center">
            {message}
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default NoDataFound;
