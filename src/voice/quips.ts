import type { Quip, QuipCategory } from './types';

/**
 * MY.OS quip catalog. Local engine, no LLM.
 *
 * Tone: dry, direct, lowkey-funny, occasionally cutting — never cruel,
 * never "as a coach I would suggest." If a line sounds like a Hallmark
 * card or a LinkedIn post, it doesn't belong here.
 *
 * Placeholders use single curly braces: {streak}, {xp}, {tasks}, etc.
 * Missing tokens at substitution time are removed silently — write quips
 * so they still read fine when a token is empty.
 */

const recap: Quip[] = [
  { text: '{streak} days running. Quietly compounding.', intensity: 'mellow' },
  { text: 'You moved the needle this week. Small ticks, real ground.', intensity: 'mellow' },
  { text: 'Steady week. The graph leans the right way.', intensity: 'mellow' },
  { text: '{xpThisWeek} XP. The receipts are in.', intensity: 'mellow' },
  { text: 'No drama, no panic, just the work. Decent.', intensity: 'mellow' },
  { text: '{tasks} tasks done. None of them owed you applause.', intensity: 'mellow' },
  { text: 'Top focus this week was {topCategory}. Tracks.', intensity: 'mellow' },
  { text: 'You showed up. The system noticed.', intensity: 'mellow' },
  { text: 'Streak intact. No fanfare needed.', intensity: 'mellow' },
  { text: 'You logged the small stuff. Small stuff is the whole game.', intensity: 'mellow' },
  { text: 'Decent week. Not your loudest, not your worst.', intensity: 'mellow' },
  { text: 'You stacked {workouts} workouts in. Body remembers.', intensity: 'mellow' },
  { text: '{prCount} PRs. Quiet wins, loud consequences.', intensity: 'mellow' },
  { text: 'No missed bills. Nothing screaming. That\'s a win.', intensity: 'mellow' },
  { text: 'A real, full week. You\'ll forget it tomorrow. We won\'t.', intensity: 'mellow' },

  { text: 'Solid week. {streak}-day streak, {xpThisWeek} XP. Don\'t fumble it.', intensity: 'standard' },
  { text: 'Receipts: {tasks} tasks, {workouts} workouts, {prCount} PRs. Numbers don\'t lie.', intensity: 'standard' },
  { text: 'Top of your week was {topCategory}. Lean in or notice why.', intensity: 'standard' },
  { text: 'Banked {xpThisWeek} XP this week. Now do it again.', intensity: 'standard' },
  { text: 'You hit your daily XP goal more than half the days. Honest week.', intensity: 'standard' },
  { text: 'Nothing on fire. Streak alive. Get the next one.', intensity: 'standard' },
  { text: 'You\'re building something. The chart proves it.', intensity: 'standard' },
  { text: 'Closed {tasks} tasks. Could you have closed more? Probably.', intensity: 'standard' },
  { text: 'Streak: {streak}. Best: don\'t check the leaderboard, you\'re only racing yourself.', intensity: 'standard' },
  { text: 'Spent {xpThisWeek} XP worth of attention this week. Was it on the right things?', intensity: 'standard' },
  { text: 'Your worst day this week was still a logged day. That counts.', intensity: 'standard' },
  { text: 'Quiet, productive, unglamorous. The kind of week that pays later.', intensity: 'standard' },
  { text: '{missedBills} bills slipped. Patch that before next week.', intensity: 'standard' },
  { text: 'Money tight, output steady. Imperfect but moving.', intensity: 'standard' },
  { text: 'Recap: nothing mythical, nothing collapsed. The middle is the work.', intensity: 'standard' },

  { text: '{xpThisWeek} XP. Some weeks you build the catapult; this was one of them.', intensity: 'spicy' },
  { text: 'You finished {tasks} tasks and dodged maybe ten more. Don\'t lie to yourself about it.', intensity: 'spicy' },
  { text: '{streak}-day streak. Cute. Now keep it past the part where it stops being fun.', intensity: 'spicy' },
  { text: 'You hit the daily goal {dailyGoalRatio}% of days. Round number says do better.', intensity: 'spicy' },
  { text: 'PRs: {prCount}. Nice. The body adapts faster than the ego, remember that.', intensity: 'spicy' },
  { text: 'You spent the week negotiating with yourself. Stop. Just do the thing.', intensity: 'spicy' },
  { text: '{missedBills} bills missed. That\'s a self-inflicted tax.', intensity: 'spicy' },
  { text: 'Top category was {topCategory}. Easy wins. What did you avoid?', intensity: 'spicy' },
  { text: 'Solid output, average ambition. The gap is the assignment.', intensity: 'spicy' },
  { text: 'You\'re not behind. You\'re also not where you said you\'d be. Both true.', intensity: 'spicy' },
  { text: 'A week of reasonable. Reasonable is how careers stall.', intensity: 'spicy' },
  { text: 'You logged your way out of trouble this week. Lucky. Don\'t mistake it for skill.', intensity: 'spicy' },
  { text: '{xpThisWeek} XP. We both know which day was wasted.', intensity: 'spicy' },
  { text: 'Past you wrote the goals. Present you negotiated the targets down. Notice it.', intensity: 'spicy' },
  { text: 'Decent week. Not the week you\'d brag about. Make next one different.', intensity: 'spicy' },
];

const push: Quip[] = [
  { text: 'Go do one thing. The smallest one. Right now.', intensity: 'mellow' },
  { text: 'Two minutes. That\'s all it asks for.', intensity: 'mellow' },
  { text: 'Pick the easiest task on the list. Then pick another.', intensity: 'mellow' },
  { text: 'You don\'t have to feel like it. You just have to do it.', intensity: 'mellow' },
  { text: 'Open the app, hit one box. That\'s the whole move.', intensity: 'mellow' },
  { text: 'Momentum is cheap once you\'re moving. Move.', intensity: 'mellow' },
  { text: 'One rep. One task. One bill. Pick one.', intensity: 'mellow' },
  { text: 'The list isn\'t shrinking by itself.', intensity: 'mellow' },
  { text: 'Future you wants this done. Present you can deliver.', intensity: 'mellow' },
  { text: '{streak} days down. Don\'t blink the streak away today.', intensity: 'mellow' },
  { text: 'Five minutes of action beats an hour of thinking about it.', intensity: 'mellow' },
  { text: 'Small. Now. Done. That\'s the order.', intensity: 'mellow' },
  { text: 'You feel sluggish. Action fixes that.', intensity: 'mellow' },
  { text: 'Start ugly. Cleanup is later\'s job.', intensity: 'mellow' },
  { text: 'You\'ve done harder than this on a worse day.', intensity: 'mellow' },

  { text: 'Stop reading this. Do one task. Come back.', intensity: 'standard' },
  { text: 'Streak\'s at {streak}. Don\'t be the reason it ends.', intensity: 'standard' },
  { text: 'You don\'t need motivation. You need a stopwatch and ten minutes.', intensity: 'standard' },
  { text: 'The only person impressed by overthinking is you.', intensity: 'standard' },
  { text: 'No more research. Action. Now.', intensity: 'standard' },
  { text: 'You\'ve been "about to" all day. About-to is not a position.', intensity: 'standard' },
  { text: 'Pick the one you\'ve been avoiding. That\'s the assignment.', intensity: 'standard' },
  { text: 'Discipline is just the version of you that doesn\'t negotiate.', intensity: 'standard' },
  { text: 'The day is short. Your excuses are not.', intensity: 'standard' },
  { text: 'You said you\'d do this. The receipts will show whether you did.', intensity: 'standard' },
  { text: 'Starting is most of it. The rest is just continuing.', intensity: 'standard' },
  { text: 'You can rest after. Not before.', intensity: 'standard' },
  { text: 'Do it tired. Tired works.', intensity: 'standard' },
  { text: 'No one is going to do this for you. Including past you.', intensity: 'standard' },
  { text: 'The list looks long because you\'ve been staring at it. Start. Watch it shrink.', intensity: 'standard' },

  { text: 'Quit stalling. The hardest thing on your list takes 12 minutes. You have 12 minutes.', intensity: 'spicy' },
  { text: 'You\'re not "thinking about it." You\'re avoiding it. Different verb.', intensity: 'spicy' },
  { text: 'Open the app. Hit something. Stop performing for an audience that doesn\'t exist.', intensity: 'spicy' },
  { text: 'Your streak is a candle, not a forest fire. Don\'t blow it out.', intensity: 'spicy' },
  { text: 'You\'ve scrolled longer than this task would have taken. Notice that.', intensity: 'spicy' },
  { text: 'Comfort is loud today. Crush the volume on it.', intensity: 'spicy' },
  { text: 'Be honest: you don\'t want to start because starting means finishing might not happen.', intensity: 'spicy' },
  { text: 'The version of you that finishes this is the only version that matters tonight.', intensity: 'spicy' },
  { text: 'Tomorrow-you is begging present-you to handle it. Don\'t betray the kid.', intensity: 'spicy' },
  { text: 'No epic moves required. Just the next dumb little step.', intensity: 'spicy' },
  { text: 'You\'re negotiating with yourself like a lawyer who lost the case. Move.', intensity: 'spicy' },
  { text: 'Discipline isn\'t glamorous. Neither is your couch at 9pm with three things undone.', intensity: 'spicy' },
  { text: 'Stop optimizing the system. Run the system.', intensity: 'spicy' },
  { text: 'Resistance is data. The thing you\'re resisting is the thing.', intensity: 'spicy' },
  { text: 'Easy days won\'t carry you. Pay the toll.', intensity: 'spicy' },
];

const real_talk: Quip[] = [
  { text: 'You skipped yesterday. That\'s allowed once. Make today the answer.', intensity: 'mellow' },
  { text: 'Some weeks are maintenance. This is one of them. That\'s fine.', intensity: 'mellow' },
  { text: 'You\'ve been avoiding the money screen. It won\'t feel better the longer you wait.', intensity: 'mellow' },
  { text: 'You\'re tired. Log one thing anyway. Just one.', intensity: 'mellow' },
  { text: 'The streak isn\'t the point. The streak is just the receipt.', intensity: 'mellow' },
  { text: 'You\'re fine. Things are fine. Keep moving.', intensity: 'mellow' },
  { text: 'Not every day is a Big Day. Some are just days. Log them.', intensity: 'mellow' },
  { text: 'Slow weeks build the floor. The floor matters.', intensity: 'mellow' },
  { text: 'You don\'t need a breakthrough. You need a rep.', intensity: 'mellow' },
  { text: 'Tired is honest. Skipping is a choice. Choose well.', intensity: 'mellow' },
  { text: 'You don\'t have to enjoy it. You have to do it. Different bar.', intensity: 'mellow' },
  { text: 'No grand plan today. Just the next small move.', intensity: 'mellow' },
  { text: 'You\'re building. Not every brick looks like progress.', intensity: 'mellow' },
  { text: 'Show up bored. Bored still counts.', intensity: 'mellow' },
  { text: 'You can want it and not feel like it. Both at once. Move anyway.', intensity: 'mellow' },

  { text: '{missedBills} bills overdue. Not catastrophe. Still your job to fix.', intensity: 'standard' },
  { text: 'You hit your daily XP goal {dailyGoalRatio}% of days. The number isn\'t the problem; ignoring it is.', intensity: 'standard' },
  { text: 'You\'re not lazy. You\'re distracted. Different fix.', intensity: 'standard' },
  { text: 'The plan was good. The execution slipped. Plans don\'t do work.', intensity: 'standard' },
  { text: 'You\'re past the new-thing dopamine. This is where the reps actually count.', intensity: 'standard' },
  { text: 'You\'ve spent more time picking the system than running the system.', intensity: 'standard' },
  { text: 'A streak isn\'t a personality. It\'s a habit. Don\'t make it precious.', intensity: 'standard' },
  { text: 'Be honest about which goal you\'ve quietly stopped working on.', intensity: 'standard' },
  { text: 'Your bank account would prefer you check it. So would your future.', intensity: 'standard' },
  { text: 'You\'re not behind anyone. You are behind your own targets. That\'s the only metric.', intensity: 'standard' },
  { text: 'You can fix the week in two days. You can\'t fix it by Friday with one day.', intensity: 'standard' },
  { text: 'Something\'s off this week. Logging it is the first step to fixing it.', intensity: 'standard' },
  { text: 'You\'re tougher than the obstacle. Stop performing the struggle.', intensity: 'standard' },
  { text: '{xpThisWeek} XP. Half of that came from one good day. Spread it out.', intensity: 'standard' },
  { text: 'Your week looks like maintenance. That\'s OK. Don\'t mistake it for progress, though.', intensity: 'standard' },

  { text: 'You\'re hiding behind organization. Reorganize less. Do more.', intensity: 'spicy' },
  { text: 'You said you\'d save. Then you didn\'t. The math is unimpressed.', intensity: 'spicy' },
  { text: 'You skip the things that scare you. Then you wonder why nothing\'s changing.', intensity: 'spicy' },
  { text: 'Your streak is short on purpose. You\'re afraid of caring about something.', intensity: 'spicy' },
  { text: 'You\'re not "in a slump." You\'re in a pattern. Different problem, different fix.', intensity: 'spicy' },
  { text: 'You spent the week negotiating the goal smaller. Notice it.', intensity: 'spicy' },
  { text: '{missedBills} bills overdue. That\'s not bad luck, that\'s a tab.', intensity: 'spicy' },
  { text: 'Your effort spread is uneven. You crush easy categories and dodge the hard one.', intensity: 'spicy' },
  { text: 'Your goals are aggressive. Your weekday is not. Pick a side.', intensity: 'spicy' },
  { text: 'The version of you that talks about discipline is louder than the version that practices it.', intensity: 'spicy' },
  { text: 'You\'ve had this goal for three months. The deadline didn\'t move. You did.', intensity: 'spicy' },
  { text: 'You aren\'t blocked. You\'re bored. Different problem.', intensity: 'spicy' },
  { text: 'You skipped the gym, then skipped the make-up, then skipped the make-up\'s make-up. Stop the cascade.', intensity: 'spicy' },
  { text: 'You don\'t have a productivity problem. You have a finishing problem.', intensity: 'spicy' },
  { text: 'You wanted easier. You got easier. Are you happier?', intensity: 'spicy' },
];

const streak_milestone: Quip[] = [
  { text: '{streak} days. Foundation poured.', intensity: 'mellow' },
  { text: '{streak} in a row. The chain matters.', intensity: 'mellow' },
  { text: '{streak} days. Quiet, but stacking.', intensity: 'mellow' },
  { text: '{streak} consecutive. Habit forming.', intensity: 'mellow' },
  { text: '{streak} days clean. Don\'t get cocky. Get curious.', intensity: 'mellow' },
  { text: 'A {streak}-day run. Past you would be impressed.', intensity: 'mellow' },

  { text: '{streak} days. The hard part is keeping it past day 30.', intensity: 'standard' },
  { text: 'Streak {streak}. Don\'t make it a personality. Make it a floor.', intensity: 'standard' },
  { text: '{streak} days in. The compound interest just turned on.', intensity: 'standard' },
  { text: '{streak} consecutive days. Most people quit at week two. You didn\'t.', intensity: 'standard' },
  { text: '{streak} days. Now zoom out and notice nothing crashed.', intensity: 'standard' },
  { text: '{streak}. Halfway between starting and forgetting it was hard.', intensity: 'standard' },

  { text: '{streak} days. Don\'t let it become the only thing you\'re proud of.', intensity: 'spicy' },
  { text: '{streak}. Now stop checking the streak counter and do the work.', intensity: 'spicy' },
  { text: '{streak} days. Cute. Push past the part where it stops being a novelty.', intensity: 'spicy' },
  { text: '{streak} consecutive days. You\'re not special. You\'re just not quitting.', intensity: 'spicy' },
];

const level_up: Quip[] = [
  { text: 'Level {newLevel}. Earned, not given.', intensity: 'mellow' },
  { text: 'Up to level {newLevel}. The chart noticed.', intensity: 'mellow' },
  { text: 'Level {newLevel}. Same person, slightly more receipts.', intensity: 'mellow' },
  { text: '{newLevel}. Quietly leveling.', intensity: 'mellow' },
  { text: 'Level up. Status unchanged, capacity higher.', intensity: 'mellow' },

  { text: 'Level {newLevel}. The XP doesn\'t lie.', intensity: 'standard' },
  { text: 'Level {newLevel}. Now build the next one.', intensity: 'standard' },
  { text: 'You hit {newLevel}. Don\'t coast. Compound.', intensity: 'standard' },
  { text: '{newLevel}. The reward is more game, not less.', intensity: 'standard' },
  { text: 'Level {newLevel} unlocked. Nothing changes; that\'s the whole point.', intensity: 'standard' },

  { text: 'Level {newLevel}. Big deal in here. Outside, prove it.', intensity: 'spicy' },
  { text: '{newLevel}. Now do it again at level {newLevel}+1.', intensity: 'spicy' },
  { text: 'Level {newLevel}. The number is for you. The work is for everyone.', intensity: 'spicy' },
];

const goal_complete: Quip[] = [
  { text: '{goalTitle} — done. Banked, not borrowed.', intensity: 'mellow' },
  { text: 'Goal closed: {goalTitle}. Pick the next one.', intensity: 'mellow' },
  { text: '{goalTitle}. Past you would be relieved.', intensity: 'mellow' },
  { text: 'You finished {goalTitle}. The whole point of the system.', intensity: 'mellow' },
  { text: '{goalTitle}: complete. Move the bar.', intensity: 'mellow' },

  { text: 'Goal hit: {goalTitle}. Don\'t spend the win, raise the floor.', intensity: 'standard' },
  { text: '{goalTitle} — done. The hardest thing was starting it.', intensity: 'standard' },
  { text: 'Goal completed. Receipts: every contribution logged. That\'s the real prize.', intensity: 'standard' },
  { text: 'You said you\'d do {goalTitle}. You did. Note the pattern.', intensity: 'standard' },
  { text: '{goalTitle}: closed. Set the next bigger one before the dopamine fades.', intensity: 'standard' },

  { text: '{goalTitle} — done. Stop celebrating. Start the next one tonight.', intensity: 'spicy' },
  { text: 'Goal hit. The lesson isn\'t the win, it\'s how stupidly long you debated starting.', intensity: 'spicy' },
  { text: '{goalTitle}: complete. Notice you survived. Now aim higher.', intensity: 'spicy' },
];

const pr_set: Quip[] = [
  { text: 'PR. The bar moved.', intensity: 'mellow' },
  { text: 'New record. Quietly above where you were.', intensity: 'mellow' },
  { text: 'PR locked in. Body remembers.', intensity: 'mellow' },
  { text: 'Heavier. The chart will say so for months.', intensity: 'mellow' },

  { text: 'PR. Now don\'t skip the next session.', intensity: 'standard' },
  { text: 'Record broken. The system noticed.', intensity: 'standard' },
  { text: 'New PR. The next one is harder. As it should be.', intensity: 'standard' },
  { text: 'PR. Sleep well, eat well, do it again.', intensity: 'standard' },

  { text: 'PR. Don\'t announce it. Bank it.', intensity: 'spicy' },
  { text: 'New record. The bar rose. So did the floor.', intensity: 'spicy' },
];

const overdue_bill: Quip[] = [
  { text: '{missedBills} bills overdue. Knock them out one at a time.', intensity: 'mellow' },
  { text: 'You\'ve got bills sitting. Pay one. The dread costs more than the bill.', intensity: 'mellow' },
  { text: 'A bill missed isn\'t a crisis. Two missed becomes one.', intensity: 'mellow' },

  { text: '{missedBills} overdue. Late fees do a number on your XP rate, in a sense.', intensity: 'standard' },
  { text: 'Bills overdue. The longer you wait, the louder they get.', intensity: 'standard' },

  { text: '{missedBills} bills overdue. That\'s a self-imposed tax. Just pay them.', intensity: 'spicy' },
  { text: 'You have the money. Or you have a problem. Either way, the bill doesn\'t care.', intensity: 'spicy' },
];

const lazy_day: Quip[] = [
  { text: 'No XP today. Tomorrow won\'t fix itself.', intensity: 'mellow' },
  { text: 'Quiet day. One small log keeps the streak.', intensity: 'mellow' },
  { text: 'Slow day. Make a tiny move and rest.', intensity: 'mellow' },

  { text: 'Zero today. The streak is on the line. Pick anything.', intensity: 'standard' },
  { text: 'No log today. Don\'t make tomorrow start at zero.', intensity: 'standard' },

  { text: 'Nothing logged. Nothing to show. Nothing to debate.', intensity: 'spicy' },
  { text: 'Empty day. Tomorrow you\'ll either tell yourself it was a rest day, or a skip. Choose now.', intensity: 'spicy' },
];

const all_done: Quip[] = [
  { text: 'Daily list cleared. Day counts.', intensity: 'mellow' },
  { text: 'All daily tasks done. Boring is the goal.', intensity: 'mellow' },
  { text: 'Clean board. Bank it.', intensity: 'mellow' },

  { text: 'Daily list — clean. Don\'t lose the habit by celebrating it.', intensity: 'standard' },
  { text: 'All done. The compounding is silent.', intensity: 'standard' },

  { text: 'List cleared. Now go do something off-list. The system isn\'t the goal.', intensity: 'spicy' },
];

const big_xp_day: Quip[] = [
  { text: '{xpToday} XP today. Big day. Get rest.', intensity: 'mellow' },
  { text: 'Loud day. Quiet rest. Both required.', intensity: 'mellow' },

  { text: '{xpToday} XP. Don\'t torch it tomorrow with a zero.', intensity: 'standard' },
  { text: 'Big day banked. The averaging-down is what kills momentum, not the up days.', intensity: 'standard' },

  { text: '{xpToday} XP. Don\'t fall in love with the spike. Build the floor.', intensity: 'spicy' },
];

const small_xp_day: Quip[] = [
  { text: '{xpToday} XP. Streak alive. That\'s the floor.', intensity: 'mellow' },
  { text: 'Tiny day. Tiny days count.', intensity: 'mellow' },

  { text: 'Small XP day. Better than zero. Better than yesterday.', intensity: 'standard' },
  { text: 'You logged enough to keep the chain. Tomorrow, more.', intensity: 'standard' },

  { text: 'Bare minimum logged. We see it. So do you.', intensity: 'spicy' },
];

export const QUIPS: Record<QuipCategory, Quip[]> = {
  recap,
  push,
  real_talk,
  streak_milestone,
  level_up,
  goal_complete,
  pr_set,
  overdue_bill,
  lazy_day,
  all_done,
  big_xp_day,
  small_xp_day,
};

/** Quick stats for the Voice Studio. */
export function quipCounts(): Record<QuipCategory, number> {
  return Object.fromEntries(
    (Object.keys(QUIPS) as QuipCategory[]).map((k) => [k, QUIPS[k].length]),
  ) as Record<QuipCategory, number>;
}
