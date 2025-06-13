import React from 'react';
import { Container, Box, Paper } from '@mui/material';

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disableGutters?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 'lg',
  disableGutters = false,
}) => {
  return (
    <Container maxWidth={maxWidth} disableGutters={disableGutters}>
      <Box py={4}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
          {children}
        </Paper>
      </Box>
    </Container>
  );
}; 