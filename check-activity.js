const { prisma } = require('./src/lib/prisma');

async function checkRecentActivity() {
  try {
    console.log('Checking recent feedback and queue activity...\n');
    
    // Check recent feedback
    const recentFeedback = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        category: true,
        rating: true,
        message: true,
        page: true,
        status: true,
        createdAt: true,
        user: { select: { email: true, name: true } }
      }
    });
    
    console.log(`=== RECENT FEEDBACK (${recentFeedback.length} items) ===`);
    recentFeedback.forEach((fb, index) => {
      console.log(`${index + 1}. ID: ${fb.id}`);
      console.log(`   User: ${fb.user?.email ?? 'unknown'} (${fb.user?.name ?? 'no name'})`);
      console.log(`   Category: ${fb.category}`);
      console.log(`   Rating: ${fb.rating ?? 'N/A'}/5`);
      console.log(`   Status: ${fb.status}`);
      console.log(`   Message: ${fb.message.substring(0, 100)}${fb.message.length > 100 ? '...' : ''}`);
      console.log(`   Page: ${fb.page ?? 'N/A'}`);
      console.log(`   Created: ${fb.createdAt.toISOString()}`);
      console.log('');
    });
    
    // Check recent queue items
    const recentQueueItems = await prisma.queueItem.findMany({
      where: { type: 'email' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        attempts: true,
        maxAttempts: true,
        createdAt: true,
        processedAt: true,
        lastError: true,
        payload: true
      }
    });
    
    console.log(`=== RECENT EMAIL QUEUE ITEMS (${recentQueueItems.length} items) ===`);
    recentQueueItems.forEach((item, index) => {
      console.log(`${index + 1}. ID: ${item.id}`);
      console.log(`   Status: ${item.status}`);
      console.log(`   Attempts: ${item.attempts}/${item.maxAttempts}`);
      console.log(`   Created: ${item.createdAt.toISOString()}`);
      console.log(`   Processed: ${item.processedAt ? item.processedAt.toISOString() : 'N/A'}`);
      if (item.lastError) {
        console.log(`   Last Error: ${item.lastError.substring(0, 100)}${item.lastError.length > 100 ? '...' : ''}`);
      }
      // Try to parse payload as JSON to see email details
      let payloadStr = String(item.payload);
      try {
        const payload = JSON.parse(payloadStr);
        console.log(`   To: ${payload.to}`);
        console.log(`   Title: ${payload.title}`);
        console.log(`   Body: ${payload.body?.substring(0, 100)}${payload.body?.length > 100 ? '...' : ''}`);
      } catch (e) {
        console.log(`   Payload: ${payloadStr.substring(0, 100)}${payloadStr.length > 100 ? '...' : ''}`);
      }
      console.log('');
    });
    
    // Count totals
    const feedbackCount = await prisma.feedback.count();
    const queueCount = await prisma.queueItem.count({ where: { type: 'email' } });
    const pendingQueueCount = await prisma.queueItem.count({ 
      where: { type: 'email', status: 'pending' } 
    });
    const processingQueueCount = await prisma.queueItem.count({ 
      where: { type: 'email', status: 'processing' } 
    });
    const failedQueueCount = await prisma.queueItem.count({ 
      where: { type: 'email', status: 'failed' } 
    });
    const succeededQueueCount = await prisma.queueItem.count({ 
      where: { type: 'email', status: 'succeeded' } 
    });
    
    console.log(`=== SUMMARY ===`);
    console.log(`Total Feedback Records: ${feedbackCount}`);
    console.log(`Total Email Queue Items: ${queueCount}`);
    console.log(`  - Pending: ${pendingQueueCount}`);
    console.log(`  - Processing: ${processingQueueCount}`);
    console.log(`  - Failed: ${failedQueueCount}`);
    console.log(`  - Succeeded: ${succeededQueueCount}`);
    
    if (recentFeedback.length === 0) {
      console.log('\n⚠️  NO FEEDBACK RECORDS FOUND - Feedback may not be submitting to database');
    } else {
      console.log('\n✅ Feedback records found in database');
    }
    
    if (pendingQueueCount === 0 && succeededQueueCount === 0 && failedQueueCount === 0) {
      console.log('⚠️  NO EMAIL QUEUE ACTIVITY - Feedback may not be triggering email queue');
    } else if (pendingQueueCount > 0) {
      console.log(`⚠️  ${pendingQueueCount} EMAILS PENDING - Queue worker may not be running or processing`);
    } else if (failedQueueCount > 0) {
      console.log(`⚠️  ${failedQueueCount} EMAILS FAILED - Check SMTP configuration`);
    } else if (succeededQueueCount > 0) {
      console.log(`✅ ${succeededQueueCount} EMAILS SENT SUCCESSFULLY`);
    }
    
  } catch (error) {
    console.error('Error checking activity:', error);
  }
}

checkRecentActivity();