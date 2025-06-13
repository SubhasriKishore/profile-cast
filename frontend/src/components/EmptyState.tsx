import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

interface EmptyStateProps {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message, action }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="200px"
      p={3}
    >
      <InfoIcon color="info" sx={{ fontSize: 48, mb: 2 }} />
      <Typography variant="h6" color="text.primary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" gutterBottom>
        {message}
      </Typography>
      {action && (
        <Button variant="contained" color="primary" onClick={action.onClick} sx={{ mt: 2 }}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}; 