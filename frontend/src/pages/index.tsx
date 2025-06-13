import React from 'react';
import { useRouter } from 'next/router';
import { Box, Container, Typography, Button, Grid, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ProfileIcon } from '../components/icons/ProfileIcon';
import { CastingFitIcon } from '../components/icons/CastingFitIcon';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: theme.shadows[4],
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& svg': {
    fontSize: 64,
    color: theme.palette.primary.main,
  },
}));

export default function Home() {
  const router = useRouter();

  const handleCastingFiterClick = () => {
    router.push('/castingfit');
  };

  const handleProfilerClick = () => {
    router.push('/profiler');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 8, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Profile Cast
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Choose your Agent to get started
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={6}>
          <StyledPaper onClick={handleCastingFiterClick}>
            <IconWrapper>
              <CastingFitIcon />
            </IconWrapper>
            <Typography variant="h4" component="h2" gutterBottom>
              CastingFit Agent
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              Conduct AI-powered CastingFit Discussions with candidates. Configure parameters,
              initiate sessions, and receive real-time feedback.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 3 }}
              onClick={handleCastingFiterClick}
            >
              Start CastingFit
            </Button>
          </StyledPaper>
        </Grid>

        <Grid item xs={12} md={6}>
          <StyledPaper onClick={handleProfilerClick}>
            <IconWrapper>
              <ProfileIcon />
            </IconWrapper>
            <Typography variant="h4" component="h2" gutterBottom>
              Talent Profiler Agent
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              Analyze candidate profiles through an interactive chat interface.
              Access and process profile data from configured sources.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 3 }}
              onClick={handleProfilerClick}
            >
              Start Profiling
            </Button>
          </StyledPaper>
        </Grid>
      </Grid>
    </Container>
  );
} 