import RefreshState from "./refresh-state";

class RefreshStateSet {
  constructor() {
    this.states = {};
  }

  findOrInit(taskOrGroup) {
    let guid = taskOrGroup._guid;
    let taskState = this.states[guid];
    if (!taskState) {
      taskState = this.states[guid] = new RefreshState(taskOrGroup);
    }
    return taskState;
  }

  // After cancelling/queueing task instances, we have to recompute the derived state
  // of all the tasks that had/have task instances in this scheduler. We do this by
  // looping through all the Tasks that we've accumulated state for, and then recursively
  // applying/adding to the state of any TaskGroups they belong to.
  computeFinalStates(callback) {
    this.computeRecursiveState();
    this.forEachState(state => callback(state.taskOrGroup, state.computeState()));
  }

  computeRecursiveState() {
    this.forEachState(taskState => {
      let lastState = taskState;
      taskState.recurseTaskGroups(taskGroup => {
        let state = this.findOrInit(taskGroup);
        state.applyStateFrom(lastState);
        lastState = state;
      });
    });
  }

  forEachState(callback) {
    Object.keys(this.states).forEach(k => callback(this.states[k]));
  }
}

export default RefreshStateSet;
