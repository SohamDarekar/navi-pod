import { motion } from "framer-motion";
import styled, { keyframes, css } from "styled-components";
import { Unit } from "utils/constants";
import { useSyncStatus } from "providers/SyncStatusProvider";

const Container = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(180deg, #B1B5C0 0%, #686E7A 100%);
  padding: ${Unit.SM} ${Unit.MD};
  text-align: center;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
`;

const SyncCard = styled.div`
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: ${Unit.SM} ${Unit.MD};
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 180px;
`;

const IconContainer = styled.div`
  margin-bottom: ${Unit.XS};
`;

const Icon = styled.div<{ $isComplete?: boolean; $isSyncing?: boolean }>`
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  ${(props) => {
    if (props.$isComplete) return css`animation: ${fadeIn} 0.5s ease-out;`;
    if (props.$isSyncing) return css`animation: ${spin} 2s linear infinite;`;
    return css``;
  }}
`;

const Title = styled.h3`
  margin: 0 0 ${Unit.XXS};
  font-size: 13px;
  font-weight: 600;
  color: white;
`;

const Subtitle = styled.p`
  margin: 0 0 ${Unit.XS};
  font-size: 10px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.3;
`;

const ProgressBarContainer = styled.div`
  width: 120px;
  margin: ${Unit.XS} 0 ${Unit.XXS};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 5px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 3px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.1);
`;

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${(props) => props.$progress}%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.95) 0%, white 100%);
  border-radius: 3px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.4);
`;

const StatusText = styled.div`
  margin-top: ${Unit.XS};
  font-size: 11px;
  font-weight: 600;
  color: white;
  letter-spacing: 0.3px;
`;

const DetailText = styled.div`
  margin-top: ${Unit.XS};
  font-size: 11px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.75);
`;

const CountBadge = styled.div`
  margin-top: ${Unit.XS};
  font-size: 9px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  padding: 3px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
`;

const SyncStatusPreview = () => {
  const { syncStatus } = useSyncStatus();
  const { isSyncing, progress, currentStep, totalItems, syncedItems } = syncStatus;
  
  if (!isSyncing && progress === 100) {
    return (
      <Container>
        <SyncCard>
          <IconContainer>
            <Icon $isComplete={true}>✓</Icon>
          </IconContainer>
          <Title>Sync Complete</Title>
          <Subtitle>All music synced with Navidrome</Subtitle>
          {totalItems > 0 && (
            <CountBadge>{totalItems} items</CountBadge>
          )}
        </SyncCard>
      </Container>
    );
  }

  if (!isSyncing && progress === 0) {
    return (
      <Container>
        <SyncCard>
          <IconContainer>
            <Icon $isComplete={true}>🎵</Icon>
          </IconContainer>
          <Title>Ready to Sync</Title>
          <Subtitle>Select Sync Now to update your library</Subtitle>
        </SyncCard>
      </Container>
    );
  }

  return (
    <Container>
      <SyncCard>
        <IconContainer>
          <Icon $isSyncing={true}>⟳</Icon>
        </IconContainer>
        <Title>Syncing...</Title>
        <ProgressBarContainer>
          <ProgressBar>
            <ProgressFill $progress={progress} />
          </ProgressBar>
        </ProgressBarContainer>
        <StatusText>{Math.round(progress)}%</StatusText>
        {currentStep && <DetailText>{currentStep}</DetailText>}
        {totalItems > 0 && (
          <CountBadge>{syncedItems} / {totalItems}</CountBadge>
        )}
      </SyncCard>
    </Container>
  );
};

export default SyncStatusPreview;
