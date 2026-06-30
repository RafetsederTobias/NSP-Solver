eligible(U, S) :-
    user(U), station(S),
    #count { Sk : requires(S, Sk), not has_skill(U, Sk) } = 0.

eligible_day(U, S, D) :-
    eligible(U, S), day(D),
    not blocked_day(U, D).

{ assigned(U, S, D) : eligible_day(U, S, D) }.

% Blocked days cannot be assigned
:- assigned(U, S, D), blocked_day(U, D).

:- user(U), max_days(U, Max),
   #count { D : assigned(U, _, D) } > Max.

% No user at two stations on the same day
:- user(U), day(D),
   #count { S : assigned(U, S, D) } > 1.

% Respect max staffing per station per day
:- station(S), day(D),
   #count { U : assigned(U, S, D) } > Max,
   max_assignments(S, Max).

unstaffed(S, D) :-
    station(S), day(D),
    not assigned(_, S, D).

dropped(U, S, D) :-
    was_assigned(U, S, D),
    not assigned(U, S, D).

added(U, S, D) :-
    assigned(U, S, D),
    not was_assigned(U, S, D).


prefer keeping existing assignments 
#heuristic assigned(U, S, D) : was_assigned(U, S, D). [10, true]

#minimize {
    100@3, S, D : unstaffed(S, D);
     10@2, U, S, D : dropped(U, S, D);
      2@2, U, S, D : added(U, S, D)
}.

#show assigned/3.