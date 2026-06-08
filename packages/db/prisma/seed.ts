import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient, CandidateStatus, InterviewType, InterviewStatus, Recommendation } from '../src/generated/prisma/client.ts';
import { OrganizationRole } from '../src/generated/prisma/enums.ts';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data in reverse dependency order. Multi-tenant
  // tables (Membership, Invitation) and Organization sit at the top
  // of the cascade, so they go last.
  await prisma.skillAssessment.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.note.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.stage.deleteMany();
  await prisma.position.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.twoFactorConfirmation.deleteMany();
  await prisma.twoFactorToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log('🧹 Cleared existing data');

  // 0. Create the default Organization. Every seeded row below scopes
  //    to this org's id.
  const defaultOrg = await prisma.organization.create({
    data: {
      slug: 'default',
      name: 'Default Organization',
      billingEmail: 'admin@company.com',
    },
  });
  console.log('🏢 Created default organization');

  // 1. Create Users (5 users)
  const hashedPassword = await bcrypt.hash('password123', 12);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@company.com',
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  const manager1 = await prisma.user.create({
    data: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: 'Mike Chen',
      email: 'mike.chen@company.com',
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  const interviewer1 = await prisma.user.create({
    data: {
      name: 'Alice Smith',
      email: 'alice.smith@company.com',
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  const interviewer2 = await prisma.user.create({
    data: {
      name: 'Bob Wilson',
      email: 'bob.wilson@company.com',
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  console.log('👥 Created 5 users');

  // 1b. Membership rows — admin = OWNER, others mapped from legacy role.
  const memberships: Array<{ userId: string; role: OrganizationRole }> = [
    { userId: adminUser.id, role: OrganizationRole.OWNER },
    { userId: manager1.id, role: OrganizationRole.MANAGER },
    { userId: manager2.id, role: OrganizationRole.MANAGER },
    { userId: interviewer1.id, role: OrganizationRole.INTERVIEWER },
    { userId: interviewer2.id, role: OrganizationRole.INTERVIEWER },
  ];
  for (const m of memberships) {
    await prisma.membership.create({
      data: { ...m, organizationId: defaultOrg.id, acceptedAt: new Date() },
    });
  }
  console.log('🪪 Created 5 memberships (admin=OWNER)');

  // 2. Create Company Settings
  await prisma.settings.create({
    data: {
      organizationId: defaultOrg.id,
      companyName: 'TechCorp Solutions',
      emailNotifications: true,
      feedbackReminders: true,
      defaultInterviewLength: 60,
    },
  });

  console.log('⚙️ Created company settings');

  // 3. Create Workflows with Stages (2 workflows)
  const techWorkflow = await prisma.workflow.create({
    data: {
      name: 'Technical Interview Process',
      description: 'Standard technical interview workflow for engineering positions',
      isDefault: true,
      organizationId: defaultOrg.id,
    },
  });

  const managerWorkflow = await prisma.workflow.create({
    data: {
      name: 'Management Interview Process',
      description: 'Interview workflow for management and leadership positions',
      isDefault: false,
      organizationId: defaultOrg.id,
    },
  });

  // Create Stages for Tech Workflow
  const techStage1 = await prisma.stage.create({
    data: {
      name: 'Phone Screening',
      description: 'Initial phone screening with recruiter',
      order: 1,
      workflowId: techWorkflow.id,
      organizationId: defaultOrg.id,
    },
  });

  const techStage2 = await prisma.stage.create({
    data: {
      name: 'Technical Interview',
      description: 'Technical assessment with senior developer',
      order: 2,
      workflowId: techWorkflow.id,
      organizationId: defaultOrg.id,
    },
  });

  const techStage3 = await prisma.stage.create({
    data: {
      name: 'Manager Interview',
      description: 'Interview with hiring manager',
      order: 3,
      workflowId: techWorkflow.id,
      organizationId: defaultOrg.id,
    },
  });

  // Create Stages for Manager Workflow
  const mgmtStage1 = await prisma.stage.create({
    data: {
      name: 'HR Screening',
      description: 'Initial screening with HR',
      order: 1,
      workflowId: managerWorkflow.id,
      organizationId: defaultOrg.id,
    },
  });

  const mgmtStage2 = await prisma.stage.create({
    data: {
      name: 'Panel Interview',
      description: 'Panel interview with team leads',
      order: 2,
      workflowId: managerWorkflow.id,
      organizationId: defaultOrg.id,
    },
  });

  console.log('🔄 Created 2 workflows with stages');

  // 4. Create Positions (3 positions)
  const frontendPos = await prisma.position.create({
    data: {
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      isActive: true,
      workflowId: techWorkflow.id,
      organizationId: defaultOrg.id,
    },
  });

  const backendPos = await prisma.position.create({
    data: {
      title: 'Backend Developer',
      department: 'Engineering',
      isActive: true,
      workflowId: techWorkflow.id,
      organizationId: defaultOrg.id,
    },
  });

  const pmPos = await prisma.position.create({
    data: {
      title: 'Product Manager',
      department: 'Product',
      isActive: true,
      workflowId: managerWorkflow.id,
      organizationId: defaultOrg.id,
    },
  });

  console.log('💼 Created 3 positions');

  // 5. Create Tags (5 tags)
  const reactTag = await prisma.tag.create({ data: { name: 'React', organizationId: defaultOrg.id } });
  const nodeTag = await prisma.tag.create({ data: { name: 'Node.js', organizationId: defaultOrg.id } });
  const pythonTag = await prisma.tag.create({ data: { name: 'Python', organizationId: defaultOrg.id } });
  const seniorTag = await prisma.tag.create({ data: { name: 'Senior Level', organizationId: defaultOrg.id } });
  const remoteTag = await prisma.tag.create({ data: { name: 'Remote OK', organizationId: defaultOrg.id } });

  console.log('🏷️ Created 5 tags');

  // 6. Create Candidates (10 candidates)
  const candidates = [];

  const candidatesData = [
    {
      name: 'John Doe',
      email: 'john.doe@gmail.com',
      phone: '+1-555-0101',
      status: CandidateStatus.NEW,
      source: 'LinkedIn',
      positionId: frontendPos.id,
      tagIds: [reactTag.id, seniorTag.id],
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@gmail.com',
      phone: '+1-555-0102',
      status: CandidateStatus.IN_PROCESS,
      source: 'Indeed',
      positionId: backendPos.id,
      tagIds: [nodeTag.id, pythonTag.id],
    },
    {
      name: 'David Brown',
      email: 'david.brown@gmail.com',
      phone: '+1-555-0103',
      status: CandidateStatus.OFFERED,
      source: 'Referral',
      positionId: frontendPos.id,
      tagIds: [reactTag.id, remoteTag.id],
    },
    {
      name: 'Emily Davis',
      email: 'emily.davis@gmail.com',
      phone: '+1-555-0104',
      status: CandidateStatus.HIRED,
      source: 'Company Website',
      positionId: pmPos.id,
      tagIds: [seniorTag.id],
    },
    {
      name: 'Michael Wilson',
      email: 'michael.wilson@gmail.com',
      phone: '+1-555-0105',
      status: CandidateStatus.IN_PROCESS,
      source: 'Glassdoor',
      positionId: backendPos.id,
      tagIds: [pythonTag.id, nodeTag.id],
    },
    {
      name: 'Lisa Johnson',
      email: 'lisa.johnson@gmail.com',
      phone: '+1-555-0106',
      status: CandidateStatus.NEW,
      source: 'AngelList',
      positionId: frontendPos.id,
      tagIds: [reactTag.id],
    },
    {
      name: 'Robert Lee',
      email: 'robert.lee@gmail.com',
      phone: '+1-555-0107',
      status: CandidateStatus.REJECTED,
      source: 'LinkedIn',
      positionId: backendPos.id,
      tagIds: [nodeTag.id],
    },
    {
      name: 'Anna Garcia',
      email: 'anna.garcia@gmail.com',
      phone: '+1-555-0108',
      status: CandidateStatus.IN_PROCESS,
      source: 'Referral',
      positionId: pmPos.id,
      tagIds: [seniorTag.id, remoteTag.id],
    },
    {
      name: 'Thomas Anderson',
      email: 'thomas.anderson@gmail.com',
      phone: '+1-555-0109',
      status: CandidateStatus.NEW,
      source: 'Stack Overflow Jobs',
      positionId: frontendPos.id,
      tagIds: [reactTag.id, pythonTag.id],
    },
    {
      name: 'Maria Rodriguez',
      email: 'maria.rodriguez@gmail.com',
      phone: '+1-555-0110',
      status: CandidateStatus.WITHDRAWN,
      source: 'Indeed',
      positionId: backendPos.id,
      tagIds: [nodeTag.id, remoteTag.id],
    },
  ];

  for (const candidateData of candidatesData) {
    const { tagIds, positionId, ...data } = candidateData;
    const candidate = await prisma.candidate.create({
      data: {
        ...data,
        organization: { connect: { id: defaultOrg.id } },
        position: { connect: { id: positionId } },
        createdBy: { connect: { id: adminUser.id } },
        managedBy: { connect: { id: manager1.id } },
        tags: { connect: tagIds.map(id => ({ id })) },
      },
    });
    candidates.push(candidate);
  }

  console.log('👨‍💼 Created 10 candidates');

  // 7. Create Interviews (8 interviews)
  const now = new Date();
  const interviews = [];

  const interviewsData: Array<{
    title: string;
    startTime: Date;
    endTime: Date;
    location: string;
    type: InterviewType;
    status: InterviewStatus;
    candidateId: string;
    positionId: string;
    stageId: string;
    interviewerIds: string[];
    notes?: string;
  }> = [
    {
      title: 'Frontend Technical Interview',
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
      location: 'Zoom Meeting Room 1',
      type: InterviewType.TECHNICAL,
      status: InterviewStatus.SCHEDULED,
      candidateId: candidates[0].id,
      positionId: frontendPos.id,
      stageId: techStage2.id,
      interviewerIds: [interviewer1.id],
    },
    {
      title: 'Backend System Design',
      startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // + 1.5 hours
      location: 'Conference Room A',
      type: InterviewType.TECHNICAL,
      status: InterviewStatus.SCHEDULED,
      candidateId: candidates[1].id,
      positionId: backendPos.id,
      stageId: techStage2.id,
      interviewerIds: [interviewer2.id, manager2.id],
    },
    {
      title: 'Product Manager Final Round',
      startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday (completed)
      endTime: new Date(now.getTime() - 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Yesterday + 1 hour
      location: 'Executive Conference Room',
      type: InterviewType.FINAL,
      status: InterviewStatus.COMPLETED,
      candidateId: candidates[3].id,
      positionId: pmPos.id,
      stageId: mgmtStage2.id,
      interviewerIds: [manager1.id],
      notes: 'Excellent candidate with strong product vision and leadership experience.',
    },
    {
      title: 'Phone Screening',
      startTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      endTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // + 30 mins
      location: 'Phone Call',
      type: InterviewType.SCREENING,
      status: InterviewStatus.COMPLETED,
      candidateId: candidates[4].id,
      positionId: backendPos.id,
      stageId: techStage1.id,
      interviewerIds: [interviewer1.id],
      notes: 'Good technical background, moving to next round.',
    },
    {
      title: 'Frontend Behavioral Interview',
      startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // In 3 days
      endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // + 45 mins
      location: 'Zoom Meeting Room 2',
      type: InterviewType.BEHAVIORAL,
      status: InterviewStatus.SCHEDULED,
      candidateId: candidates[5].id,
      positionId: frontendPos.id,
      stageId: techStage3.id,
      interviewerIds: [manager1.id],
    },
    {
      title: 'Technical Assessment',
      startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Week ago
      endTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000), // + 2 hours
      location: 'Lab Room B',
      type: 'TECHNICAL',
      status: 'COMPLETED',
      candidateId: candidates[6].id,
      positionId: backendPos.id,
      stageId: techStage2.id,
      interviewerIds: [interviewer2.id],
      notes: 'Struggled with system design concepts.',
    },
    {
      title: 'Product Manager Panel',
      startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // In 5 days
      endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 75 * 60 * 1000), // + 75 mins
      location: 'Executive Conference Room',
      type: InterviewType.MANAGER,
      status: InterviewStatus.SCHEDULED,
      candidateId: candidates[7].id,
      positionId: pmPos.id,
      stageId: mgmtStage2.id,
      interviewerIds: [manager1.id, manager2.id],
    },
    {
      title: 'Frontend Code Review',
      startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      endTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // + 90 mins
      location: 'Development Office',
      type: 'TECHNICAL',
      status: 'COMPLETED',
      candidateId: candidates[8].id,
      positionId: frontendPos.id,
      stageId: techStage2.id,
      interviewerIds: [interviewer1.id, interviewer2.id],
      notes: 'Excellent coding skills and clean architecture.',
    },
  ];

  for (const interviewData of interviewsData) {
    const { interviewerIds, candidateId, positionId, stageId, ...data } = interviewData;
    const interview = await prisma.interview.create({
      data: {
        ...data,
        organization: { connect: { id: defaultOrg.id } },
        candidate: { connect: { id: candidateId } },
        position: { connect: { id: positionId } },
        stage: stageId ? { connect: { id: stageId } } : undefined,
        createdBy: { connect: { id: adminUser.id } },
        interviewers: { connect: interviewerIds.map(id => ({ id })) },
      },
    });
    interviews.push(interview);
  }

  console.log('📅 Created 8 interviews');

  // 8. Create Feedback for completed interviews
  const completedInterviews = interviews.filter(i => 
    interviewsData.find(d => d.status === 'COMPLETED' && 
    d.candidateId === i.candidateId)
  );

  const feedbackData = [
    {
      rating: 5,
      recommendation: Recommendation.STRONG_HIRE,
      comment: 'Exceptional product sense and leadership skills. Strong cultural fit.',
      skills: [
        { skill: 'Product Strategy', rating: 5, comment: 'Outstanding strategic thinking' },
        { skill: 'Leadership', rating: 5, comment: 'Natural leader with great communication' },
        { skill: 'Analytics', rating: 4, comment: 'Good data-driven approach' },
      ]
    },
    {
      rating: 4,
      recommendation: Recommendation.HIRE,
      comment: 'Solid technical skills and good cultural fit. Ready for next round.',
      skills: [
        { skill: 'Python', rating: 4, comment: 'Strong Python knowledge' },
        { skill: 'System Design', rating: 3, comment: 'Good understanding, room for growth' },
        { skill: 'Communication', rating: 4, comment: 'Clear communicator' },
      ]
    },
    {
      rating: 2,
      recommendation: Recommendation.NO_HIRE,
      comment: 'Technical skills below expectations for senior role.',
      skills: [
        { skill: 'System Design', rating: 2, comment: 'Weak system design skills' },
        { skill: 'Problem Solving', rating: 2, comment: 'Struggled with complex problems' },
        { skill: 'Node.js', rating: 3, comment: 'Basic knowledge only' },
      ]
    },
    {
      rating: 5,
      recommendation: Recommendation.STRONG_HIRE,
      comment: 'Outstanding technical skills and excellent problem-solving approach.',
      skills: [
        { skill: 'React', rating: 5, comment: 'Expert level React knowledge' },
        { skill: 'JavaScript', rating: 5, comment: 'Deep JS understanding' },
        { skill: 'Architecture', rating: 5, comment: 'Great architectural thinking' },
      ]
    },
  ];

  for (let i = 0; i < completedInterviews.length && i < feedbackData.length; i++) {
    const interview = completedInterviews[i];
    const data = feedbackData[i];
    
    const feedback = await prisma.feedback.create({
      data: {
        rating: data.rating,
        recommendation: data.recommendation,
        comment: data.comment,
        organizationId: defaultOrg.id,
        interviewId: interview.id,
        candidateId: interview.candidateId,
        interviewerId: interviewer1.id, // Using first interviewer for simplicity
      },
    });

    // Create skill assessments
    for (const skillData of data.skills) {
      await prisma.skillAssessment.create({
        data: {
          skill: skillData.skill,
          rating: skillData.rating,
          comment: skillData.comment,
          feedbackId: feedback.id,
          organizationId: defaultOrg.id,
        },
      });
    }
  }

  console.log('📝 Created feedback for completed interviews');

  // 9. Create Notes for some candidates
  const notesData = [
    { candidateId: candidates[0].id, content: 'Candidate has 5+ years React experience. Interested in remote work.' },
    { candidateId: candidates[1].id, content: 'Strong backend skills. Previously worked at startups. Looking for growth opportunities.' },
    { candidateId: candidates[3].id, content: 'Excellent PM background at top tech companies. Strong hire recommendation from all interviewers.' },
    { candidateId: candidates[7].id, content: 'Transitioning from engineering to product management. Shows great potential.' },
    { candidateId: candidates[8].id, content: 'Impressive portfolio and open source contributions. Team lead experience.' },
  ];

  for (const noteData of notesData) {
    await prisma.note.create({
      data: {
        content: noteData.content,
        candidateId: noteData.candidateId,
        organizationId: defaultOrg.id,
      },
    });
  }

  console.log('📓 Created 5 candidate notes');

  // Summary
  const counts = {
    users: await prisma.user.count(),
    positions: await prisma.position.count(),
    candidates: await prisma.candidate.count(),
    interviews: await prisma.interview.count(),
    feedbacks: await prisma.feedback.count(),
    workflows: await prisma.workflow.count(),
    stages: await prisma.stage.count(),
    tags: await prisma.tag.count(),
    notes: await prisma.note.count(),
    skillAssessments: await prisma.skillAssessment.count(),
  };

  console.log('\n🎉 Seed completed successfully!');
  console.log('📊 Summary:');
  Object.entries(counts).forEach(([model, count]) => {
    console.log(`   ${model}: ${count}`);
  });
  console.log('\n👤 Test Login Credentials:');
  console.log('   Admin: admin@company.com');
  console.log('   Manager: sarah.johnson@company.com');
  console.log('   Interviewer: alice.smith@company.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });