const conditionNames = {
  0: "unspeeded",
  1: "speeded",
  2: "verbal-protocol",
};
const trialDuration = 3000;

function compileTimeline(condition) {
  // pre-load stimuli
  const preLoad = {
    type: jsPsychPreload,
    images: [
      "assets/alice.png",
      "assets/bob.png",
      "assets/charlie.png",
      "assets/david.png",
      "assets/eve.png",
      "assets/yes.png",
      "assets/no.png",
      "assets/question-mark.png",
      "assets/example-rumor.png",
      "assets/example-test.png",
    ],
  };

  // consent form and instructions
  const consent = {
    type: jsPsychInstructions,
    pages: [consentText],
    show_clickable_nav: true,
    button_label_next: "I agree",
  };
  const instructions = {
    type: jsPsychInstructions,
    pages: getInstructionPages(condition),
    show_clickable_nav: true,
  };

  const setupStages = [preLoad, consent, instructions];

  if (condition == "verbal-protocol") {
    const initMic = {
      type: jsPsychInitializeMicrophone,
    };
    setupStages.push(initMic);
  }

  // learning phase trials
  const learningTrials = trainStimuli.map((s) => {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: formatStimulus(s),
      choices: [" "],
      prompt: "<p>Press space to continue.</p>",
    };
  });

  const doneLearningMessage = {
    type: jsPsychInstructions,
    pages: getDoneLearningPages(condition),
    show_clickable_nav: true,
    allow_previous: false,
  };

  // test phase trials
  const testTrials = testStimuli.map((s) => {
    return {
      type:
        condition == "verbal-protocol"
          ? jsPsychHtmlKeyboardResponseAudioRecording
          : jsPsychHtmlKeyboardResponse,
      stimulus: formatStimulus(s),
      choices: ["n", "y"],
      prompt:
        condition == "verbal-protocol"
          ? ` <p>Press "y" for yes, "n" for no. Please describe your thinking aloud.</p>`
          : `<p>Press "y" for yes, "n" for no.</p>`,
      on_load: condition == "speeded" ? startTimer : null,
      trial_duration: condition == "speeded" ? trialDuration : null,
    };
  });

  const postExperimentSurvey = {
    type: jsPsychSurveyText,
    preamble:
      "<p>You have reached the end of the experiment!</p><p>You will be redirected to Prolific after this survey. Please do not navigate away from this page.</p>",
    questions: [
      {
        prompt:
          "Please describe the strategy you used to answer the questions in this experiment.",
        rows: 6,
        columns: 50,
        name: "strategy",
      },
      {
        prompt: "What did you think this experiment was about?",
        rows: 6,
        columns: 50,
        name: "about",
      },
      {
        prompt:
          "Please give any feedback you have about the experiment, including problems encountered.",
        rows: 6,
        columns: 50,
        name: "feedback",
      },
    ],
    name: "strategy",
  };

  shuffle(learningTrials);
  shuffle(testTrials);

  return [
    ...setupStages,
    ...learningTrials,
    doneLearningMessage,
    ...testTrials,
    postExperimentSurvey,
  ];
}

// get the condition from the URL
const jsPsych = initJsPsych({
  on_finish: function (data) {
    proliferate.submit({
      trials: data.values(),
    });
  },
});

const conditionInt = jsPsych.data.getURLVariable("condition");
const condition = conditionNames[conditionInt];

const timeline = compileTimeline(condition);

jsPsych.run(timeline);
