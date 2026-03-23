/**
 * This file reserves the Prisma seed entry point for the database workspace.
 * It exists to provide a consistent place for future local bootstrap data.
 * It fits the system by avoiding ad hoc seed scripts scattered around the repository.
 */
import { CommitmentEventType, CommitmentStatus, VerificationType, prisma } from "../src";

/**
 * This function inserts a small local bootstrap dataset for manual testing.
 * It receives no parameters because the seed values are self-contained.
 * It returns a promise that resolves after the sample records are upserted.
 * It is important because local development benefits from one repeatable baseline user and commitment.
 */
async function main() {
  const demoWalletAddress = "0x1111111111111111111111111111111111111111";

  const user = await prisma.user.upsert({
    create: {
      walletAddress: demoWalletAddress
    },
    update: {},
    where: {
      walletAddress: demoWalletAddress
    }
  });

  const existingCommitment = await prisma.commitment.findUnique({
    where: {
      onchainId: 1n
    }
  });

  if (existingCommitment === null) {
    const commitment = await prisma.commitment.create({
      data: {
        amount: "10000000000000000",
        createCommitmentTxHash: "0xseededcreate",
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1_000),
        description: "Completar una sesion de foco y registrar evidencia local para pruebas.",
        failReceiver: "0x2222222222222222222222222222222222222222",
        onchainId: 1n,
        status: CommitmentStatus.ACTIVE,
        title: "Commitment seed",
        userId: user.id
      }
    });

    await prisma.commitmentEvent.create({
      data: {
        commitmentId: commitment.id,
        metadata: {
          source: "seed"
        },
        toStatus: CommitmentStatus.ACTIVE,
        type: CommitmentEventType.CREATED
      }
    });

    await prisma.verification.create({
      data: {
        commitmentId: commitment.id,
        confidence: 0.88,
        model: "mock-gemini-heuristic",
        provider: "mock",
        rawResponse: {
          source: "seed"
        },
        reasoning: "Verification de ejemplo generada por el seed local.",
        result: true,
        type: VerificationType.INITIAL
      }
    });
  }

  console.info("Database seed completed.");
}

main().catch((error: unknown) => {
  console.error("Database seed failed.", error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
